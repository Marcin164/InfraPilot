import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EscalationActionService } from './escalationAction.service';
import { Tickets } from 'src/entities/tickets.entity';
import { SlaEngineService } from './slaEngine.service';

const makeEscalation = (actionType: string, config: any = {}): any => ({
  id: 'esc-1',
  definition: { actionType, actionConfig: config },
  slaInstance: { ticketId: 'ticket-1' },
});

describe('EscalationActionService', () => {
  let service: EscalationActionService;
  let ticketsRepo: jest.Mocked<any>;
  let slaEngine: jest.Mocked<any>;

  beforeEach(async () => {
    ticketsRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    };
    slaEngine = {
      handlePriorityChange: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationActionService,
        { provide: getRepositoryToken(Tickets), useValue: ticketsRepo },
        { provide: SlaEngineService, useValue: slaEngine },
      ],
    }).compile();

    service = module.get<EscalationActionService>(EscalationActionService);
  });

  describe('execute', () => {
    it('resolves without error for NOTIFY action (stub — no dispatcher wired up yet)', async () => {
      await expect(service.execute(makeEscalation('NOTIFY', {}))).resolves.toBeUndefined();
    });

    it('updates assignmentGroup for REASSIGN action', async () => {
      await service.execute(makeEscalation('REASSIGN', { group: 'Level-2' }));
      expect(ticketsRepo.update).toHaveBeenCalledWith('ticket-1', { assignmentGroup: 'Level-2' });
    });

    it('increases priority for PRIORITY_UP action', async () => {
      const ticket = { id: 'ticket-1', priority: 'Low' };
      ticketsRepo.findOneBy.mockResolvedValue(ticket);
      await service.execute(makeEscalation('PRIORITY_UP', { to: 'High' }));
      expect(ticket.priority).toBe('High');
      expect(ticketsRepo.save).toHaveBeenCalled();
    });

    it('triggers SLA re-evaluation when priority changes', async () => {
      const ticket = { id: 'ticket-1', priority: 'Low' };
      ticketsRepo.findOneBy.mockResolvedValue(ticket);
      await service.execute(makeEscalation('PRIORITY_UP', { to: 'High' }));
      // No manager passed in by the caller here -> forwarded through as
      // undefined, so this falls back to the default (non-transactional)
      // repository. See the next test for the transactional path.
      expect(slaEngine.handlePriorityChange).toHaveBeenCalledWith(ticket, undefined);
    });

    it('threads a passed-in manager through to the ticket repo and slaEngine call', async () => {
      // Reusing the same connection/transaction as the caller (e.g. the
      // escalation engine's queryRunner) is what avoids the self-deadlock
      // documented in project_audit_lock_deadlock: this action must not open
      // a second connection while the caller's transaction still holds a
      // lock the action's writes would need.
      const ticket = { id: 'ticket-1', priority: 'Low' };
      const managerTicketsRepo = {
        findOneBy: jest.fn().mockResolvedValue(ticket),
        save: jest.fn().mockResolvedValue(undefined),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(managerTicketsRepo) };

      await service.execute(makeEscalation('PRIORITY_UP', { to: 'High' }), manager as any);

      expect(manager.getRepository).toHaveBeenCalledWith(Tickets);
      expect(managerTicketsRepo.findOneBy).toHaveBeenCalled();
      expect(ticketsRepo.findOneBy).not.toHaveBeenCalled();
      expect(slaEngine.handlePriorityChange).toHaveBeenCalledWith(ticket, manager);
    });

    it('does not trigger SLA re-evaluation when priority unchanged', async () => {
      const ticket = { id: 'ticket-1', priority: 'High' };
      ticketsRepo.findOneBy.mockResolvedValue(ticket);
      await service.execute(makeEscalation('PRIORITY_UP', { to: 'High' }));
      expect(slaEngine.handlePriorityChange).not.toHaveBeenCalled();
    });

    it('does nothing for PRIORITY_UP when ticket not found', async () => {
      ticketsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.execute(makeEscalation('PRIORITY_UP', { to: 'High' }))).resolves.toBeUndefined();
    });
  });
});
