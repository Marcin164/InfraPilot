import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketDeviceLifecycleListener } from './ticketDeviceLifecycle.listener';
import { Devices, DeviceLifecycle } from 'src/entities/devices.entity';
import { Tickets, TicketState } from 'src/entities/tickets.entity';
import { DevicesService } from 'src/services/devices.service';
import { AuditService } from 'src/services/audit.service';
import { TicketStateChangedEvent } from 'src/events/ticket-state-changed.event';

const mockTicket = (overrides: Partial<Tickets> = {}): Tickets =>
  ({
    id: 'ticket-1',
    number: 1001,
    deviceId: 'device-1',
    ...overrides,
  } as Tickets);

const mockDevice = (overrides: Partial<Devices> = {}): Devices =>
  ({
    id: 'device-1',
    lifecycle: DeviceLifecycle.IN_REPAIR,
    ...overrides,
  } as Devices);

describe('TicketDeviceLifecycleListener', () => {
  let listener: TicketDeviceLifecycleListener;
  let devicesRepo: jest.Mocked<any>;
  let devicesService: jest.Mocked<any>;
  let auditService: jest.Mocked<any>;

  beforeEach(async () => {
    devicesRepo = { findOneBy: jest.fn() };
    devicesService = { updateLifecycle: jest.fn().mockResolvedValue(undefined) };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketDeviceLifecycleListener,
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        { provide: DevicesService, useValue: devicesService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    listener = module.get<TicketDeviceLifecycleListener>(TicketDeviceLifecycleListener);
  });

  it('restores an in-repair device to active when its ticket resolves', async () => {
    devicesRepo.findOneBy.mockResolvedValue(mockDevice());

    await listener.handleTicketStateChanged(
      new TicketStateChangedEvent(mockTicket(), TicketState.IN_PROGRESS, TicketState.RESOLVED),
    );

    expect(devicesService.updateLifecycle).toHaveBeenCalledWith('device-1', {
      lifecycle: DeviceLifecycle.ACTIVE,
    });
    expect(auditService.log).toHaveBeenCalledWith(
      'Device',
      'device-1',
      'lifecycle_auto_restored',
      expect.objectContaining({ reason: 'ticket_closed', ticketId: 'ticket-1' }),
    );
  });

  it('does nothing when the ticket has no linked device', async () => {
    await listener.handleTicketStateChanged(
      new TicketStateChangedEvent(mockTicket({ deviceId: null as any }), TicketState.IN_PROGRESS, TicketState.CLOSED),
    );

    expect(devicesRepo.findOneBy).not.toHaveBeenCalled();
    expect(devicesService.updateLifecycle).not.toHaveBeenCalled();
  });

  it('does nothing when the new state is not a closing state', async () => {
    await listener.handleTicketStateChanged(
      new TicketStateChangedEvent(mockTicket(), TicketState.NEW, TicketState.ASSIGNED),
    );

    expect(devicesRepo.findOneBy).not.toHaveBeenCalled();
  });

  it('does nothing when the device is not in repair', async () => {
    devicesRepo.findOneBy.mockResolvedValue(mockDevice({ lifecycle: DeviceLifecycle.ACTIVE }));

    await listener.handleTicketStateChanged(
      new TicketStateChangedEvent(mockTicket(), TicketState.IN_PROGRESS, TicketState.RESOLVED),
    );

    expect(devicesService.updateLifecycle).not.toHaveBeenCalled();
  });

  it('does nothing when the device cannot be found', async () => {
    devicesRepo.findOneBy.mockResolvedValue(null);

    await listener.handleTicketStateChanged(
      new TicketStateChangedEvent(mockTicket(), TicketState.IN_PROGRESS, TicketState.RESOLVED),
    );

    expect(devicesService.updateLifecycle).not.toHaveBeenCalled();
  });

  it('swallows errors from updateLifecycle so the listener never throws', async () => {
    devicesRepo.findOneBy.mockResolvedValue(mockDevice());
    devicesService.updateLifecycle.mockRejectedValue(new Error('boom'));

    await expect(
      listener.handleTicketStateChanged(
        new TicketStateChangedEvent(mockTicket(), TicketState.IN_PROGRESS, TicketState.RESOLVED),
      ),
    ).resolves.toBeUndefined();
  });
});
