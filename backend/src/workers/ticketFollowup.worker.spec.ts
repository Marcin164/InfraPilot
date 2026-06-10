import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketFollowupWorker } from './ticketFollowup.worker';
import { Tickets, TicketState } from 'src/entities/tickets.entity';
import { TicketsComments } from 'src/entities/ticketsComments.entity';
import { AuditService } from 'src/services/audit.service';

const REMIND_HOURS = 48;
const AUTOCLOSE_HOURS = 168;

const awaitingTicket = (overrides: Partial<Tickets> = {}): Tickets =>
  ({
    id: 'ticket-1',
    state: TicketState.AWAITING_USER,
    updatedAt: new Date(Date.now() - (REMIND_HOURS + 1) * 3600 * 1000),
    ...overrides,
  } as Tickets);

describe('TicketFollowupWorker', () => {
  let worker: TicketFollowupWorker;
  let tickets: jest.Mocked<any>;
  let comments: jest.Mocked<any>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const commentInstance = {
      id: 'comment-new',
      content: '',
      ticket: null,
    };

    tickets = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (t: any) => t),
    };

    comments = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(commentInstance),
      save: jest.fn(async (c: any) => c),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketFollowupWorker,
        { provide: getRepositoryToken(Tickets), useValue: tickets },
        { provide: getRepositoryToken(TicketsComments), useValue: comments },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    worker = module.get<TicketFollowupWorker>(TicketFollowupWorker);
  });

  it('does nothing when no awaiting tickets exist', async () => {
    tickets.find.mockResolvedValue([]);
    await worker.run();
    expect(tickets.save).not.toHaveBeenCalled();
    expect(comments.save).not.toHaveBeenCalled();
  });

  it('auto-closes tickets older than the autoclose cutoff', async () => {
    const oldTicket = awaitingTicket({
      updatedAt: new Date(Date.now() - (AUTOCLOSE_HOURS + 1) * 3600 * 1000),
    });
    tickets.find.mockResolvedValue([oldTicket]);

    await worker.run();

    expect(tickets.save).toHaveBeenCalledWith(
      expect.objectContaining({
        state: TicketState.CLOSED,
        closureCode: 'auto_no_response',
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      'Ticket',
      oldTicket.id,
      'auto_closed',
      expect.any(Object),
    );
  });

  it('sends reminder comment to tickets past remind cutoff but not autoclose cutoff', async () => {
    const staleTicket = awaitingTicket({
      updatedAt: new Date(Date.now() - (REMIND_HOURS + 1) * 3600 * 1000),
    });
    tickets.find.mockResolvedValue([staleTicket]);
    comments.findOne.mockResolvedValue(null);

    await worker.run();

    expect(comments.save).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      'Ticket',
      staleTicket.id,
      'auto_followup_sent',
      expect.any(Object),
    );
    expect(tickets.save).not.toHaveBeenCalled();
  });

  it('skips tickets that already have a reminder comment', async () => {
    const staleTicket = awaitingTicket({
      updatedAt: new Date(Date.now() - (REMIND_HOURS + 1) * 3600 * 1000),
    });
    tickets.find.mockResolvedValue([staleTicket]);
    comments.findOne.mockResolvedValue({ id: 'existing-comment' });

    await worker.run();

    expect(comments.save).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('does not throw when an error occurs — it swallows and logs', async () => {
    tickets.find.mockRejectedValue(new Error('DB down'));
    await expect(worker.run()).resolves.not.toThrow();
  });

  it('sets closedAt on auto-closed tickets', async () => {
    const oldTicket = awaitingTicket({
      updatedAt: new Date(Date.now() - (AUTOCLOSE_HOURS + 1) * 3600 * 1000),
    });
    tickets.find.mockResolvedValue([oldTicket]);

    await worker.run();

    const saved = tickets.save.mock.calls[0][0];
    expect(saved.closedAt).toBeInstanceOf(Date);
  });
});
