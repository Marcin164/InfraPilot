import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Tickets, TicketType, TicketPriority, TicketState } from 'src/entities/tickets.entity';
import { TicketsComments } from 'src/entities/ticketsComments.entity';
import { TicketsApprovals } from 'src/entities/ticketsApprovals.entity';
import { TicketActivity } from 'src/entities/ticketActivity.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { TicketsGateway } from 'src/gateways/tickets.gateway';
import { SlaEngineService } from './slaEngine.service';
import { AuditService } from './audit.service';
import { TicketAutoTagService } from './ticketAutoTag.service';
import { NotificationService } from './notification.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';
import { TicketWorkflowService } from './ticketWorkflow.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  createReadStream: jest.fn(() => ({ pipe: jest.fn() })),
}));

const buildQueryBuilder = (overrides: Record<string, any> = {}) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
  return qb;
};

let _ticketCounter = 0;
const mockTicket = (): Partial<Tickets> => {
  const n = ++_ticketCounter;
  return {
    id: `ticket-uuid-${n}`,
    number: 1000 + n,
    type: TicketType.INCIDENT,
    description: 'Test ticket description',
    state: TicketState.NEW,
    priority: TicketPriority.MEDIUM,
    requesterId: `requester-uuid-${n}`,
    assignee: `assignee-uuid-${n}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    parentTicketId: null as any,
  };
};

describe('TicketsService', () => {
  let service: TicketsService;

  let ticketsRepo: jest.Mocked<any>;
  let commentsRepo: jest.Mocked<any>;
  let approvalsRepo: jest.Mocked<any>;
  let activityRepo: jest.Mocked<any>;
  let adminSettingsRepo: jest.Mocked<any>;
  let slaInstanceRepo: jest.Mocked<any>;
  let gateway: jest.Mocked<any>;
  let slaEngine: jest.Mocked<any>;
  let auditService: jest.Mocked<any>;
  let autoTag: jest.Mocked<any>;
  let notifications: jest.Mocked<any>;
  let dispatcher: jest.Mocked<any>;
  let workflows: jest.Mocked<any>;

  beforeEach(async () => {
    ticketsRepo = {
      query: jest.fn().mockResolvedValue([{ nextval: '42' }]),
      create: jest.fn((dto) => dto),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(() => buildQueryBuilder()),
      manager: { transaction: jest.fn() },
    };

    commentsRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    approvalsRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    activityRepo = {
      save: jest.fn(),
    };

    adminSettingsRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn(),
    };

    slaInstanceRepo = {
      createQueryBuilder: jest.fn(() => buildQueryBuilder()),
    };

    gateway = {
      emitNewComment: jest.fn(),
      emitTicketActivity: jest.fn(),
    };

    slaEngine = {
      createForTicket: jest.fn().mockResolvedValue(undefined),
      handleStateChange: jest.fn().mockResolvedValue(undefined),
      handleResolved: jest.fn().mockResolvedValue(undefined),
      handlePriorityChange: jest.fn().mockResolvedValue(undefined),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    autoTag = {
      suggestCategory: jest.fn().mockResolvedValue(null),
    };

    notifications = {
      resolveMentions: jest.fn().mockResolvedValue([]),
    };

    dispatcher = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    workflows = {
      runOnCreate: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Tickets), useValue: ticketsRepo },
        { provide: getRepositoryToken(TicketsComments), useValue: commentsRepo },
        { provide: getRepositoryToken(TicketsApprovals), useValue: approvalsRepo },
        { provide: getRepositoryToken(TicketActivity), useValue: activityRepo },
        { provide: getRepositoryToken(AdminSettings), useValue: adminSettingsRepo },
        { provide: getRepositoryToken(SlaInstance), useValue: slaInstanceRepo },
        { provide: TicketsGateway, useValue: gateway },
        { provide: SlaEngineService, useValue: slaEngine },
        { provide: AuditService, useValue: auditService },
        { provide: TicketAutoTagService, useValue: autoTag },
        { provide: NotificationService, useValue: notifications },
        { provide: NotificationDispatcherService, useValue: dispatcher },
        { provide: TicketWorkflowService, useValue: workflows },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  // ─────────────────────────────────────────
  // generateTicketNumber
  // ─────────────────────────────────────────

  describe('generateTicketNumber', () => {
    it('returns the nextval from the DB sequence', async () => {
      ticketsRepo.query.mockResolvedValue([{ nextval: '1234' }]);
      const num = await service.generateTicketNumber();
      expect(num).toBe(1234);
    });
  });

  // ─────────────────────────────────────────
  // createTicket
  // ─────────────────────────────────────────

  describe('createTicket', () => {
    const dto = {
      type: TicketType.INCIDENT,
      description: 'Server is down',
      requesterId: 'requester-001',
      assignmentGroup: 'Level 2',
    } as any;

    beforeEach(() => {
      ticketsRepo.query.mockResolvedValue([{ nextval: '1' }]);
      ticketsRepo.save.mockImplementation(async (t) => ({ ...t, id: 'saved-ticket-id' }));
    });

    it('saves ticket and starts SLA', async () => {
      const result = await service.createTicket(dto);

      expect(ticketsRepo.save).toHaveBeenCalledTimes(1);
      expect(slaEngine.createForTicket).toHaveBeenCalledWith(expect.objectContaining({ type: dto.type }));
      expect(auditService.log).toHaveBeenCalledWith('Ticket', result.id, 'created', expect.any(Object));
    });

    it('applies auto-category when none is provided', async () => {
      autoTag.suggestCategory.mockResolvedValue({ category: 'Hardware issue' });
      const saved = { ...dto, id: 'auto-cat-ticket-id', category: 'Hardware issue' };
      ticketsRepo.save.mockResolvedValue(saved);

      const result = await service.createTicket(dto);

      expect(result.category).toBe('Hardware issue');
      expect(auditService.log).toHaveBeenCalledWith(
        'Ticket', result.id, 'auto_categorized', { category: 'Hardware issue' },
      );
    });

    it('does not call autoTag when category is already set', async () => {
      await service.createTicket({ ...dto, category: 'Network issue' });
      expect(autoTag.suggestCategory).not.toHaveBeenCalled();
    });

    it('runs workflow after creation (best-effort: error does not throw)', async () => {
      workflows.runOnCreate.mockRejectedValue(new Error('workflow misconfiguration'));
      ticketsRepo.save.mockImplementation(async (t) => ({ ...t, id: 'workflow-fail-ticket' }));

      await expect(service.createTicket(dto)).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────
  // updateTicket
  // ─────────────────────────────────────────

  describe('updateTicket', () => {
    it('throws an error when ticket is not found', async () => {
      ticketsRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
          getRepository: jest.fn().mockReturnValue({ save: jest.fn() }),
        };
        return cb(manager);
      });

      await expect(service.updateTicket('non-existent-id', {})).rejects.toThrow('Ticket not found');
    });

    it('tracks field changes and emits WebSocket activity', async () => {
      const ticket = mockTicket();
      const activityEntry = { id: 'activity-uuid-1', field: 'state' };

      ticketsRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const repoMock = { save: jest.fn().mockResolvedValue(activityEntry) };
        const manager = {
          findOne: jest.fn().mockResolvedValue({ ...ticket }),
          save: jest.fn().mockResolvedValue({ ...ticket, state: TicketState.ASSIGNED }),
          getRepository: jest.fn().mockReturnValue(repoMock),
        };
        return cb(manager);
      });

      await service.updateTicket(ticket.id!, { state: TicketState.ASSIGNED }, 'actor-id');

      expect(gateway.emitTicketActivity).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'Ticket', ticket.id, 'field_change', expect.any(Object), expect.anything(),
      );
    });

    it('calls handleResolved when state transitions to Resolved', async () => {
      const ticket = mockTicket();
      const updated = { ...ticket, state: TicketState.RESOLVED };

      ticketsRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ ...ticket }),
          save: jest.fn().mockResolvedValue(updated),
          getRepository: jest.fn().mockReturnValue({ save: jest.fn().mockResolvedValue({}) }),
        };
        return cb(manager);
      });

      await service.updateTicket(ticket.id!, { state: 'Resolved' as any });

      expect(slaEngine.handleResolved).toHaveBeenCalledWith(updated, expect.anything());
    });

    it('calls handlePriorityChange when priority changes', async () => {
      const ticket = mockTicket();
      const updated = { ...ticket, priority: TicketPriority.CRITICAL };

      ticketsRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ ...ticket }),
          save: jest.fn().mockResolvedValue(updated),
          getRepository: jest.fn().mockReturnValue({ save: jest.fn().mockResolvedValue({}) }),
        };
        return cb(manager);
      });

      await service.updateTicket(ticket.id!, { priority: TicketPriority.CRITICAL });

      expect(slaEngine.handlePriorityChange).toHaveBeenCalledWith(updated, expect.anything());
    });

    it('dispatches notification when assignee changes', async () => {
      const ticket = mockTicket();
      const newAssignee = 'new-assignee-uuid';
      const updated = { ...ticket, assignee: newAssignee };

      ticketsRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ ...ticket }),
          save: jest.fn().mockResolvedValue(updated),
          getRepository: jest.fn().mockReturnValue({ save: jest.fn().mockResolvedValue({}) }),
        };
        return cb(manager);
      });

      await service.updateTicket(ticket.id!, { assignee: newAssignee }, 'actor');

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'ticket_assigned', recipientIds: [newAssignee] }),
      );
    });

    it('dispatches state change notification to requester', async () => {
      const requesterId = 'requester-state-change-uuid';
      const ticket = { ...mockTicket(), requesterId, state: TicketState.NEW };
      const updated = { ...ticket, state: 'Assigned', requesterId };

      ticketsRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ ...ticket }),
          save: jest.fn().mockResolvedValue(updated),
          getRepository: jest.fn().mockReturnValue({ save: jest.fn().mockResolvedValue({}) }),
        };
        return cb(manager);
      });

      await service.updateTicket(ticket.id!, { state: 'Assigned' as any });

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'ticket_state_changed', recipientIds: [requesterId] }),
      );
    });
  });

  // ─────────────────────────────────────────
  // linkTicket
  // ─────────────────────────────────────────

  describe('linkTicket', () => {
    it('throws NotFoundException when ticket does not exist', async () => {
      ticketsRepo.findOneBy.mockResolvedValue(null);

      await expect(service.linkTicket('missing-id', 'parent-id', 'actor')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when linking ticket to itself', async () => {
      const ticket = mockTicket();
      ticketsRepo.findOneBy.mockResolvedValue(ticket);

      await expect(service.linkTicket(ticket.id!, ticket.id!, 'actor')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when parent ticket does not exist', async () => {
      const ticket = mockTicket();
      ticketsRepo.findOneBy
        .mockResolvedValueOnce(ticket)
        .mockResolvedValueOnce(null);

      await expect(service.linkTicket(ticket.id!, 'parent-id', 'actor')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when linking would create a cycle', async () => {
      const ticket = mockTicket();
      const parent = { ...mockTicket(), parentTicketId: ticket.id };

      ticketsRepo.findOneBy
        .mockResolvedValueOnce(ticket)
        .mockResolvedValueOnce(parent);

      await expect(service.linkTicket(ticket.id!, parent.id!, 'actor')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('links tickets successfully and records activity', async () => {
      const ticket = { ...mockTicket(), parentTicketId: null };
      const parent = { ...mockTicket(), parentTicketId: null };
      ticketsRepo.findOneBy
        .mockResolvedValueOnce(ticket)
        .mockResolvedValueOnce(parent);
      ticketsRepo.save.mockResolvedValue({ ...ticket, parentTicketId: parent.id });
      activityRepo.save.mockResolvedValue({});

      const result = await service.linkTicket(ticket.id!, parent.id!, 'actor');

      expect(ticketsRepo.save).toHaveBeenCalled();
      expect(activityRepo.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith('Ticket', ticket.id, 'linked', expect.any(Object));
      expect(result).toEqual({ id: ticket.id, parentTicketId: parent.id });
    });

    it('unlinks ticket when parentTicketId is null', async () => {
      const ticket = { ...mockTicket(), parentTicketId: 'some-parent' };
      ticketsRepo.findOneBy.mockResolvedValue(ticket);
      ticketsRepo.save.mockResolvedValue({ ...ticket, parentTicketId: null });
      activityRepo.save.mockResolvedValue({});

      const result = await service.linkTicket(ticket.id!, null, 'actor');

      expect(result.parentTicketId).toBeNull();
    });
  });

  // ─────────────────────────────────────────
  // createComment
  // ─────────────────────────────────────────

  describe('createComment', () => {
    it('saves comment and emits via WebSocket', async () => {
      const ticketId = 'ticket-comment-uuid';
      const commentId = 'comment-uuid-1';
      const savedComment = { id: commentId, content: 'Test comment', author: { id: 'u1' } };

      commentsRepo.save.mockResolvedValue({ id: commentId });
      commentsRepo.findOne.mockResolvedValue(savedComment);
      ticketsRepo.findOne.mockResolvedValue({ id: ticketId, number: 100, requester: { id: 'req1' } });

      const result = await service.createComment(ticketId, 'author-id', {
        content: 'Test comment',
        type: 'Public',
      });

      expect(commentsRepo.save).toHaveBeenCalledTimes(1);
      expect(gateway.emitNewComment).toHaveBeenCalledWith(ticketId, savedComment);
      expect(result).toBe(savedComment);
    });

    it('does not dispatch mention notification when no mentions', async () => {
      notifications.resolveMentions.mockResolvedValue([]);
      commentsRepo.save.mockResolvedValue({ id: '1' });
      commentsRepo.findOne.mockResolvedValue({ id: '1' });
      ticketsRepo.findOne.mockResolvedValue({ id: 't1', number: 1, requester: null });

      await service.createComment('ticket-id', 'author-id', { content: 'hello', type: 'Public' });

      expect(dispatcher.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ event: 'ticket_mention' }),
      );
    });

    it('dispatches mention notification for mentioned users (excluding author)', async () => {
      const authorId = 'author-mention-uuid';
      const mentionedUserId = 'mentioned-user-uuid';
      notifications.resolveMentions.mockResolvedValue([{ userId: mentionedUserId }]);
      commentsRepo.save.mockResolvedValue({ id: '1' });
      commentsRepo.findOne.mockResolvedValue({ id: '1' });
      ticketsRepo.findOne.mockResolvedValue({ id: 't1', number: 5, requester: null });

      await service.createComment('ticket-id', authorId, {
        content: `@${mentionedUserId} check this`,
        type: 'Internal',
      });

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'ticket_mention', recipientIds: [mentionedUserId] }),
      );
    });
  });

  // ─────────────────────────────────────────
  // createCommentWithAttachment
  // ─────────────────────────────────────────

  describe('createCommentWithAttachment', () => {
    it('throws BadRequestException when no file is provided', async () => {
      await expect(
        service.createCommentWithAttachment('t1', 'u1', {}, null),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for disallowed MIME type', async () => {
      const invalidFile = { mimetype: 'application/exe', originalname: 'virus.exe', buffer: Buffer.from('x'), size: 1 };

      await expect(
        service.createCommentWithAttachment('t1', 'u1', {}, invalidFile),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts valid image MIME type and saves the comment', async () => {
      const file = { mimetype: 'image/png', originalname: 'screenshot.png', buffer: Buffer.from('img'), size: 3 };
      const savedComment = { id: 'attachment-comment-uuid', attachmentMimetype: 'image/png' };

      commentsRepo.save.mockResolvedValue(savedComment);
      commentsRepo.findOne.mockResolvedValue(savedComment);

      const result = await service.createCommentWithAttachment('t1', 'u1', {}, file);

      expect(result).toBe(savedComment);
      expect(gateway.emitNewComment).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // updateApproval
  // ─────────────────────────────────────────

  describe('updateApproval', () => {
    it('throws NotFoundException when approval does not exist', async () => {
      approvalsRepo.findOne.mockResolvedValue(null);

      await expect(service.updateApproval('missing-id', { decision: 'Approved' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when approval already has a decision', async () => {
      approvalsRepo.findOne.mockResolvedValue({ id: '1', decision: 'Approved', approverId: 'u1' });

      await expect(service.updateApproval('1', { decision: 'Rejected' }, 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ForbiddenException when caller is not the assigned approver', async () => {
      approvalsRepo.findOne.mockResolvedValue({ id: '1', decision: null, approverId: 'correct-approver' });

      await expect(service.updateApproval('1', { decision: 'Approved' }, 'wrong-user')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates approval with decidedAt timestamp when caller is the approver', async () => {
      const approval = { id: '1', decision: null, approverId: 'approver-id', approver: {} };
      approvalsRepo.findOne
        .mockResolvedValueOnce(approval)
        .mockResolvedValueOnce({ ...approval, decision: 'Approved', decidedAt: expect.any(Date) });

      const result = await service.updateApproval('1', { decision: 'Approved' }, 'approver-id');

      expect(approvalsRepo.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ decision: 'Approved', decidedAt: expect.any(Date) }),
      );
      expect(result).toBeDefined();
    });
  });

  // ─────────────────────────────────────────
  // getMyTickets
  // ─────────────────────────────────────────

  describe('getMyTickets', () => {
    it('filters open tickets by default', async () => {
      const qb = buildQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) });
      ticketsRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getMyTickets('requester-id', 'open');

      const andWhereCalls = qb.andWhere.mock.calls;
      const hasOpenFilter = andWhereCalls.some(([query]: [string]) =>
        query.includes('NOT IN'),
      );
      expect(hasOpenFilter).toBe(true);
    });

    it('filters closed tickets when scope is closed', async () => {
      const qb = buildQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) });
      ticketsRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getMyTickets('requester-id', 'closed');

      const andWhereCalls = qb.andWhere.mock.calls;
      const hasClosedFilter = andWhereCalls.some(([query]: [string]) =>
        query.includes('IN (:...closedStates)'),
      );
      expect(hasClosedFilter).toBe(true);
    });
  });

  // ─────────────────────────────────────────
  // getTicketCategories
  // ─────────────────────────────────────────

  describe('getTicketCategories', () => {
    it('returns default categories when no row exists in settings', async () => {
      adminSettingsRepo.findOne.mockResolvedValue(null);

      const result = await service.getTicketCategories();

      expect(result).toHaveProperty('Incident');
      expect(result).toHaveProperty('Service');
      expect(Array.isArray(result.Incident)).toBe(true);
    });

    it('returns stored categories from admin settings', async () => {
      const custom = { Incident: ['Custom Incident'], Service: ['Custom Service'] };
      adminSettingsRepo.findOne.mockResolvedValue({ key: 'ticket_categories', value: custom });

      const result = await service.getTicketCategories();

      expect(result).toEqual(custom);
    });
  });

  // ─────────────────────────────────────────
  // updateTicketCategories
  // ─────────────────────────────────────────

  describe('updateTicketCategories', () => {
    it('creates a new settings row when it does not exist', async () => {
      adminSettingsRepo.findOne.mockResolvedValue(null);
      const newValue = { Incident: ['A'], Service: ['B'] };
      adminSettingsRepo.save.mockResolvedValue({ value: newValue });

      const result = await service.updateTicketCategories(newValue);

      expect(adminSettingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'ticket_categories', value: newValue }),
      );
      expect(adminSettingsRepo.save).toHaveBeenCalled();
    });

    it('updates existing row when it already exists', async () => {
      const existing = { id: '1', key: 'ticket_categories', value: { Incident: [], Service: [] } };
      adminSettingsRepo.findOne.mockResolvedValue(existing);
      const newValue = { Incident: ['Updated'], Service: ['Updated'] };
      adminSettingsRepo.save.mockResolvedValue({ ...existing, value: newValue });

      await service.updateTicketCategories(newValue);

      expect(adminSettingsRepo.create).not.toHaveBeenCalled();
      expect(adminSettingsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ value: newValue }),
      );
    });
  });

  // ─────────────────────────────────────────
  // getAgentStats
  // ─────────────────────────────────────────

  describe('getAgentStats', () => {
    it('returns zeroed stats when userId is empty', async () => {
      const result = await service.getAgentStats('');

      expect(result).toEqual({
        openAssigned: 0,
        resolvedToday: 0,
        resolvedThisWeek: 0,
        avgMttrHours: null,
        slaCompliancePct: null,
        breachingToday: 0,
      });
    });

    it('calculates avgMttrHours correctly', async () => {
      const now = Date.now();
      const twoHoursAgo = new Date(now - 2 * 3600 * 1000);
      const resolved = [{ id: '1', createdAt: twoHoursAgo, resolvedAt: new Date(now) }];

      const qbOpen = buildQueryBuilder({ getCount: jest.fn().mockResolvedValue(3) });
      const qbToday = buildQueryBuilder({ getCount: jest.fn().mockResolvedValue(1) });
      const qbWeek = buildQueryBuilder({ getCount: jest.fn().mockResolvedValue(5) });
      const qbResolved = buildQueryBuilder({ getMany: jest.fn().mockResolvedValue(resolved) });
      const qbBreaching = buildQueryBuilder({ getRawMany: jest.fn().mockResolvedValue([]) });
      const qbBreaches = buildQueryBuilder({ getRawMany: jest.fn().mockResolvedValue([]) });

      let callCount = 0;
      ticketsRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return qbOpen;
        if (callCount === 2) return qbToday;
        if (callCount === 3) return qbWeek;
        if (callCount === 4) return qbResolved;
        if (callCount === 5) return qbBreaching;
        return qbBreaches;
      });
      slaInstanceRepo.createQueryBuilder
        .mockReturnValueOnce(qbBreaches)
        .mockReturnValueOnce(qbBreaching);

      const result = await service.getAgentStats('user-id');

      expect(result.avgMttrHours).toBe(2);
    });
  });

  // ─────────────────────────────────────────
  // getTicketsByRequester
  // ─────────────────────────────────────────

  describe('getTicketsByRequester', () => {
    it('returns tickets limited to 50 max', async () => {
      const tickets = [mockTicket(), mockTicket()];
      const qb = buildQueryBuilder({ getMany: jest.fn().mockResolvedValue(tickets) });
      ticketsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTicketsByRequester('user-id', 100);

      expect(qb.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(tickets);
    });
  });
});
