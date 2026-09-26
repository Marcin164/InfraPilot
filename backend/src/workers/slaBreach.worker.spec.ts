import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlaBreachWorker } from './slaBreach.worker';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { AuditService } from 'src/services/audit.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';

const makeSlaInstance = (overrides: Partial<SlaInstance> = {}): SlaInstance =>
  ({
    id: 'sla-1',
    ticketId: 'ticket-1',
    type: 'response',
    breached: false,
    paused: false,
    dueAt: new Date(Date.now() - 1000),
    ...overrides,
  } as unknown as SlaInstance);

const makeTicket = (overrides: Partial<Tickets> = {}): Tickets =>
  ({
    id: 'ticket-1',
    number: 42,
    assignee: 'agent-1',
    ...overrides,
  } as Tickets);

describe('SlaBreachWorker', () => {
  let worker: SlaBreachWorker;
  let slaRepo: jest.Mocked<any>;
  let ticketsRepo: jest.Mocked<any>;
  let audit: jest.Mocked<AuditService>;
  let dispatcher: jest.Mocked<any>;

  beforeEach(async () => {
    slaRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (inst: any) => inst),
    };
    ticketsRepo = {
      findOneBy: jest.fn().mockResolvedValue(makeTicket()),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) } as any;
    dispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaBreachWorker,
        { provide: getRepositoryToken(SlaInstance), useValue: slaRepo },
        { provide: getRepositoryToken(Tickets), useValue: ticketsRepo },
        { provide: AuditService, useValue: audit },
        { provide: NotificationDispatcherService, useValue: dispatcher },
      ],
    }).compile();

    worker = module.get<SlaBreachWorker>(SlaBreachWorker);
  });

  it('does nothing when no overdue instances exist', async () => {
    slaRepo.find.mockResolvedValue([]);
    await worker.handle();
    expect(slaRepo.save).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('marks overdue instance as breached', async () => {
    const inst = makeSlaInstance();
    slaRepo.find.mockResolvedValue([inst]);

    await worker.handle();

    expect(slaRepo.save).toHaveBeenCalledWith(expect.objectContaining({ breached: true }));
  });

  it('logs audit event for each breached instance', async () => {
    const inst = makeSlaInstance({ id: 'sla-audit' });
    slaRepo.find.mockResolvedValue([inst]);

    await worker.handle();

    expect(audit.log).toHaveBeenCalledWith(
      'SLA_INSTANCE',
      'sla-audit',
      'SLA_BREACHED',
      expect.objectContaining({ ticketId: 'ticket-1' }),
    );
  });

  it('processes multiple overdue instances independently', async () => {
    const inst1 = makeSlaInstance({ id: 'sla-a' });
    const inst2 = makeSlaInstance({ id: 'sla-b', ticketId: 'ticket-2' });
    slaRepo.find.mockResolvedValue([inst1, inst2]);

    await worker.handle();

    expect(slaRepo.save).toHaveBeenCalledTimes(2);
    expect(audit.log).toHaveBeenCalledTimes(2);
  });

  it('queries only non-breached, non-paused, overdue instances', async () => {
    await worker.handle();

    const [query] = slaRepo.find.mock.calls[0];
    expect(query.where.breached).toBe(false);
    expect(query.where.paused).toBe(false);
    expect(query.where.dueAt).toBeDefined(); // LessThanOrEqual operator
  });

  describe('ticket_sla_breach notification', () => {
    it('notifies the ticket assignee when an instance breaches', async () => {
      const inst = makeSlaInstance();
      slaRepo.find.mockResolvedValue([inst]);
      ticketsRepo.findOneBy.mockResolvedValue(makeTicket({ assignee: 'agent-1' }));

      await worker.handle();

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientIds: ['agent-1'],
          event: 'ticket_sla_breach',
          entityType: 'Ticket',
          entityId: 'ticket-1',
        }),
      );
    });

    it('does not dispatch when the ticket has no assignee', async () => {
      const inst = makeSlaInstance();
      slaRepo.find.mockResolvedValue([inst]);
      ticketsRepo.findOneBy.mockResolvedValue(makeTicket({ assignee: null as any }));

      await worker.handle();

      expect(dispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('does not let a dispatch failure stop the sweep from completing', async () => {
      const inst = makeSlaInstance();
      slaRepo.find.mockResolvedValue([inst]);
      dispatcher.dispatch.mockRejectedValue(new Error('mail down'));

      await expect(worker.handle()).resolves.not.toThrow();
      expect(slaRepo.save).toHaveBeenCalledWith(expect.objectContaining({ breached: true }));
    });
  });
});
