import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { AuditService } from 'src/services/audit.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';

@Injectable()
export class SlaBreachWorker {
  private readonly logger = new Logger(SlaBreachWorker.name);

  constructor(
    @InjectRepository(SlaInstance)
    private readonly slaRepo: Repository<SlaInstance>,
    @InjectRepository(Tickets)
    private readonly ticketsRepo: Repository<Tickets>,

    private readonly audit: AuditService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  @Cron('* * * * *')
  async handle() {
    const now = new Date();

    const overdue = await this.slaRepo.find({
      where: {
        breached: false,
        paused: false,
        dueAt: LessThanOrEqual(now),
      },
    });

    for (const inst of overdue) {
      inst.breached = true;
      await this.slaRepo.save(inst);

      await this.audit.log('SLA_INSTANCE', inst.id, 'SLA_BREACHED', {
        ticketId: inst.ticketId,
        dueAt: inst.dueAt,
      });

      await this.notifyBreach(inst);
    }
  }

  /** Notifies whoever's actually responsible -- the assignee if the ticket
   * has one, otherwise there's nobody to tell besides the ops-wide channels
   * (out of scope here; assignment is what makes an SLA breach actionable). */
  private async notifyBreach(inst: SlaInstance): Promise<void> {
    try {
      const ticket = await this.ticketsRepo.findOneBy({ id: inst.ticketId });
      if (!ticket?.assignee) return;

      await this.dispatcher.dispatch({
        recipientIds: [ticket.assignee],
        event: 'ticket_sla_breach',
        title: `SLA breached: ticket #${ticket.number}`,
        body: `The ${inst.type} SLA for ticket #${ticket.number} was due at ${inst.dueAt.toLocaleString()} and has now breached.`,
        url: `/admin/helpdesk/${ticket.id}`,
        entityType: 'Ticket',
        entityId: ticket.id,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to dispatch ticket_sla_breach for SLA instance ${inst.id}: ${(err as Error).message}`,
      );
    }
  }
}
