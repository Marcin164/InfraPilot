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
    it('calls notify (console) for NOTIFY action', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await service.execute(makeEscalation('NOTIFY', {}));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
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
      expect(slaEngine.handlePriorityChange).toHaveBeenCalledWith(ticket);
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
