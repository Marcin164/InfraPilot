import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Devices, DeviceLifecycle } from 'src/entities/devices.entity';
import { TicketState } from 'src/entities/tickets.entity';
import { DevicesService } from 'src/services/devices.service';
import { AuditService } from 'src/services/audit.service';
import { EVENTS } from 'src/events/events.constants';
import { TicketStateChangedEvent } from 'src/events/ticket-state-changed.event';

const CLOSING_STATES = new Set<string>([
  TicketState.RESOLVED,
  TicketState.CLOSED,
]);

/**
 * Closing a ticket tied to a device that's mid-repair is the signal that
 * the repair is done -- restore the device to active so nobody has to
 * remember to flip it back by hand.
 */
@Injectable()
export class TicketDeviceLifecycleListener {
  private readonly logger = new Logger(TicketDeviceLifecycleListener.name);

  constructor(
    @InjectRepository(Devices)
    private readonly devicesRepository: Repository<Devices>,
    private readonly devicesService: DevicesService,
    private readonly auditService: AuditService,
  ) {}

  @OnEvent(EVENTS.TICKET_STATE_CHANGED)
  async handleTicketStateChanged(event: TicketStateChangedEvent): Promise<void> {
    const { ticket, actorId } = event;
    if (!CLOSING_STATES.has(event.newState) || !ticket.deviceId) return;

    try {
      const device = await this.devicesRepository.findOneBy({ id: ticket.deviceId });
      if (!device || device.lifecycle !== DeviceLifecycle.IN_REPAIR) return;

      await this.devicesService.updateLifecycle(ticket.deviceId, {
        lifecycle: DeviceLifecycle.ACTIVE,
      });

      await this.auditService.log('Device', ticket.deviceId, 'lifecycle_auto_restored', {
        reason: 'ticket_closed',
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        previousLifecycle: DeviceLifecycle.IN_REPAIR,
        newLifecycle: DeviceLifecycle.ACTIVE,
        actorId: actorId ?? null,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to auto-restore device ${ticket.deviceId} lifecycle after ticket ${ticket.id} closed: ${(err as Error).message}`,
      );
    }
  }
}
