import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketWorkflowService } from './ticketWorkflow.service';
import { TicketWorkflow } from 'src/entities/ticketWorkflow.entity';
import { TicketCategory } from 'src/entities/ticketCategory.entity';
import { Tickets } from 'src/entities/tickets.entity';
import { TicketsApprovals } from 'src/entities/ticketsApprovals.entity';
import { TicketsComments } from 'src/entities/ticketsComments.entity';
import { AuditService } from './audit.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';

const makeTicket = (overrides: any = {}): any => ({
  id: 'ticket-1',
  number: 42,
  category: 'Network',
  requesterId: 'req-1',
  assignee: null,
  description: 'VPN issue',
  ...overrides,
});

const makeWorkflow = (overrides: any = {}): any => ({
  id: 'wf-1',
  name: 'Net Workflow',
  trigger: 'on_create',
  enabled: true,
  steps: [],
  ...overrides,
});

describe('TicketWorkflowService', () => {
  let service: TicketWorkflowService;
  let workflowsRepo: jest.Mocked<any>;
  let categoriesRepo: jest.Mocked<any>;
  let ticketsRepo: jest.Mocked<any>;
  let approvalsRepo: jest.Mocked<any>;
  let commentsRepo: jest.Mocked<any>;
  let audit: jest.Mocked<any>;
  let dispatcher: jest.Mocked<any>;

  beforeEach(async () => {
    workflowsRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (w: any) => w),
      delete: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    categoriesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (c: any) => c),
      delete: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    ticketsRepo = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    approvalsRepo = {
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn().mockResolvedValue(undefined),
    };
    commentsRepo = {
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn().mockResolvedValue(undefined),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    dispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketWorkflowService,
        { provide: getRepositoryToken(TicketWorkflow), useValue: workflowsRepo },
        { provide: getRepositoryToken(TicketCategory), useValue: categoriesRepo },
        { provide: getRepositoryToken(Tickets), useValue: ticketsRepo },
        { provide: getRepositoryToken(TicketsApprovals), useValue: approvalsRepo },
        { provide: getRepositoryToken(TicketsComments), useValue: commentsRepo },
        { provide: AuditService, useValue: audit },
        { provide: NotificationDispatcherService, useValue: dispatcher },
      ],
    }).compile();

    service = module.get<TicketWorkflowService>(TicketWorkflowService);
  });

  // ---- Categories ----

  describe('listCategories', () => {
    it('returns all categories ordered by name', async () => {
      const cats = [{ id: 'c-1', name: 'Network' }];
      categoriesRepo.find.mockResolvedValue(cats);
      const result = await service.listCategories();
      expect(result).toBe(cats);
    });
  });

  describe('upsertCategory', () => {
    it('throws BadRequestException when name is empty', async () => {
      await expect(service.upsertCategory({ name: '  ' })).rejects.toThrow(BadRequestException);
    });

    it('updates existing category found by id', async () => {
      const existing: any = { id: 'c-1', name: 'Old' };
      categoriesRepo.findOneBy.mockResolvedValue(existing);
      await service.upsertCategory({ id: 'c-1', name: 'New' });
      expect(existing.name).toBe('New');
      expect(categoriesRepo.save).toHaveBeenCalled();
    });

    it('creates new category when not found', async () => {
      categoriesRepo.findOneBy.mockResolvedValue(null);
      await service.upsertCategory({ name: 'HR' });
      expect(categoriesRepo.create).toHaveBeenCalled();
      expect(categoriesRepo.save).toHaveBeenCalled();
    });

    it('defaults color to #2B9AE9 for new category', async () => {
      categoriesRepo.findOneBy.mockResolvedValue(null);
      await service.upsertCategory({ name: 'HR' });
      const arg = categoriesRepo.create.mock.calls[0][0];
      expect(arg.color).toBe('#2B9AE9');
    });
  });

  // ---- Workflows ----

  describe('getWorkflow', () => {
    it('throws NotFoundException when workflow not found', async () => {
      await expect(service.getWorkflow('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns workflow when found', async () => {
      const wf = makeWorkflow();
      workflowsRepo.findOneBy.mockResolvedValue(wf);
      const result = await service.getWorkflow('wf-1');
      expect(result).toBe(wf);
    });
  });

  describe('upsertWorkflow', () => {
    it('creates new workflow', async () => {
      workflowsRepo.findOneBy.mockResolvedValue(null);
      await service.upsertWorkflow({ name: 'New Flow', steps: [] }, 'actor-1');
      expect(workflowsRepo.create).toHaveBeenCalled();
      expect(workflowsRepo.save).toHaveBeenCalled();
    });

    it('updates existing workflow', async () => {
      const existing: any = makeWorkflow();
      workflowsRepo.findOneBy.mockResolvedValue(existing);
      await service.upsertWorkflow({ id: 'wf-1', name: 'Updated', steps: [] }, 'actor-1');
      expect(existing.name).toBe('Updated');
      expect(workflowsRepo.save).toHaveBeenCalled();
    });

    it('sorts steps by order', async () => {
      workflowsRepo.findOneBy.mockResolvedValue(null);
      workflowsRepo.create.mockImplementation((dto: any) => dto);
      workflowsRepo.save.mockImplementation(async (w: any) => w);
      const result = await service.upsertWorkflow({
        name: 'Flow',
        steps: [
          { order: 2, type: 'notify', label: 'B', config: {} },
          { order: 1, type: 'set_field', label: 'A', config: {} },
        ],
      }, 'actor-1');
      expect(result.steps[0].order).toBe(1);
    });
  });

  // ---- Engine: runOnCreate ----

  describe('runOnCreate', () => {
    it('does nothing when ticket has no category', async () => {
      await service.runOnCreate(makeTicket({ category: null }));
      expect(categoriesRepo.findOneBy).not.toHaveBeenCalled();
    });

    it('does nothing when category has no workflowId', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: null });
      await service.runOnCreate(makeTicket());
      expect(workflowsRepo.findOneBy).not.toHaveBeenCalled();
    });

    it('does nothing when workflow is disabled', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({ enabled: false }));
      await service.runOnCreate(makeTicket());
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('runs steps and logs started/finished', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({ steps: [] }));
      await service.runOnCreate(makeTicket());
      expect(audit.log).toHaveBeenCalledWith('TicketWorkflow', 'wf-1', 'started', expect.any(Object));
      expect(audit.log).toHaveBeenCalledWith('TicketWorkflow', 'wf-1', 'finished', expect.any(Object));
    });

    it('handles set_field step', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({
        steps: [{ id: 's-1', order: 0, type: 'set_field', label: 'Set Priority', config: { field: 'priority', value: 'High' } }],
      }));
      await service.runOnCreate(makeTicket());
      expect(ticketsRepo.update).toHaveBeenCalledWith({ id: 'ticket-1' }, { priority: 'High' });
    });

    it('handles assign_to step and dispatches notification', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({
        steps: [{ id: 's-1', order: 0, type: 'assign_to', label: 'Assign', config: { userId: 'agent-1' } }],
      }));
      await service.runOnCreate(makeTicket());
      expect(ticketsRepo.update).toHaveBeenCalledWith({ id: 'ticket-1' }, { assignee: 'agent-1' });
      expect(dispatcher.dispatch).toHaveBeenCalled();
    });

    it('handles notify step with requester recipientType', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({
        steps: [{ id: 's-1', order: 0, type: 'notify', label: 'Notify', config: { recipientType: 'requester', event: 'ticket_created' } }],
      }));
      await service.runOnCreate(makeTicket({ requesterId: 'req-1' }));
      expect(dispatcher.dispatch).toHaveBeenCalledWith(expect.objectContaining({ recipientIds: ['req-1'] }));
    });

    it('handles create_comment step', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({
        steps: [{ id: 's-1', order: 0, type: 'create_comment', label: 'Comment', config: { content: 'Auto note' } }],
      }));
      await service.runOnCreate(makeTicket());
      expect(commentsRepo.save).toHaveBeenCalled();
    });

    it('handles request_approval step and creates approvals', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({
        steps: [{ id: 's-1', order: 0, type: 'request_approval', label: 'Approve', config: { approverIds: ['mgr-1'] } }],
      }));
      await service.runOnCreate(makeTicket());
      expect(approvalsRepo.save).toHaveBeenCalled();
      expect(dispatcher.dispatch).toHaveBeenCalled();
    });

    it('logs step_failed but continues when step throws', async () => {
      categoriesRepo.findOneBy.mockResolvedValue({ workflowId: 'wf-1' });
      workflowsRepo.findOneBy.mockResolvedValue(makeWorkflow({
        steps: [
          { id: 's-1', order: 0, type: 'set_field', label: 'Bad', config: { field: 'forbidden', value: 'X' } },
          { id: 's-2', order: 1, type: 'set_field', label: 'Good', config: { field: 'priority', value: 'Low' } },
        ],
      }));
      await service.runOnCreate(makeTicket());
      expect(audit.log).toHaveBeenCalledWith('TicketWorkflow', 'wf-1', 'step_failed', expect.any(Object));
      // Second step still ran
      expect(ticketsRepo.update).toHaveBeenCalledWith({ id: 'ticket-1' }, { priority: 'Low' });
    });
  });
});
