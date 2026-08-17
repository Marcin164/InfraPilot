import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlaBreachService } from './slaBreach.service';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { SlaType } from 'src/entities/slaDefinition.entity';
import { AuditService } from './audit.service';

const mockSlaInstance = (overrides: Partial<SlaInstance> = {}): SlaInstance =>
  ({
    id: 'sla-inst-1',
    ticketId: 'ticket-1',
    breached: false,
    paused: false,
    respondedAt: null,
    dueAt: new Date(Date.now() + 60 * 60 * 1000), // 1h in the future
    slaDefinition: { type: SlaType.RESPONSE },
    ...overrides,
  } as SlaInstance);

describe('SlaBreachService', () => {
  let service: SlaBreachService;
  let repo: jest.Mocked<any>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      save: jest.fn(async (inst: any) => inst),
      getRepository: jest.fn(),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaBreachService,
        { provide: getRepositoryToken(SlaInstance), useValue: repo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<SlaBreachService>(SlaBreachService);
  });

  describe('finishSla', () => {
    it('marks instances with passed dueAt as breached', async () => {
      const expired = mockSlaInstance({ dueAt: new Date(Date.now() - 1000) });
      repo.find.mockResolvedValue([expired]);

      await service.finishSla('ticket-1');

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ breached: true }));
      expect(audit.log).toHaveBeenCalledWith(
        'SLA_INSTANCE', expired.id, 'SLA_BREACHED', expect.any(Object), undefined,
      );
    });

    it('does NOT mark instances with future dueAt as breached', async () => {
      const notExpired = mockSlaInstance({ dueAt: new Date(Date.now() + 60000) });
      repo.find.mockResolvedValue([notExpired]);

      await service.finishSla('ticket-1');

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ breached: false }));
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('handles multiple SLA instances per ticket', async () => {
      const expired1 = mockSlaInstance({ id: 'sla-1', dueAt: new Date(Date.now() - 2000) });
      const active = mockSlaInstance({ id: 'sla-2', dueAt: new Date(Date.now() + 60000) });
      repo.find.mockResolvedValue([expired1, active]);

      await service.finishSla('ticket-1');

      expect(repo.save).toHaveBeenCalledTimes(2);
      expect(audit.log).toHaveBeenCalledTimes(1);
    });

    it('handles empty instance list gracefully', async () => {
      repo.find.mockResolvedValue([]);

      await service.finishSla('ticket-no-sla');

      expect(repo.save).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('uses provided manager instead of injected repo', async () => {
      const expired = mockSlaInstance({ dueAt: new Date(Date.now() - 1000) });
      const managerRepo = {
        find: jest.fn().mockResolvedValue([expired]),
        save: jest.fn(async (inst: any) => inst),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(managerRepo) };

      await service.finishSla('ticket-1', manager);

      expect(repo.find).not.toHaveBeenCalled();
      expect(managerRepo.save).toHaveBeenCalled();
    });
  });

  describe('markFirstResponse', () => {
    it('sets respondedAt on a Response instance that has not responded yet', async () => {
      const inst = mockSlaInstance({ breached: true });
      repo.find.mockResolvedValue([inst]);

      await service.markFirstResponse('ticket-1');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ respondedAt: expect.any(Date) }),
      );
    });

    it('leaves breached untouched -- a late reply does not un-breach', async () => {
      const inst = mockSlaInstance({ breached: true });
      repo.find.mockResolvedValue([inst]);

      await service.markFirstResponse('ticket-1');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ breached: true }),
      );
    });

    it('is idempotent -- does not overwrite an already-recorded response', async () => {
      const firstResponse = new Date('2026-01-01T09:00:00Z');
      const inst = mockSlaInstance({ respondedAt: firstResponse });
      repo.find.mockResolvedValue([inst]);

      await service.markFirstResponse('ticket-1');

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('ignores Resolution-type instances', async () => {
      const inst = mockSlaInstance({
        slaDefinition: { type: SlaType.RESOLUTION } as any,
      });
      repo.find.mockResolvedValue([inst]);

      await service.markFirstResponse('ticket-1');

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('handles multiple instances, only updating the matching Response one', async () => {
      const response = mockSlaInstance({ id: 'sla-response' });
      const resolution = mockSlaInstance({
        id: 'sla-resolution',
        slaDefinition: { type: SlaType.RESOLUTION } as any,
      });
      repo.find.mockResolvedValue([response, resolution]);

      await service.markFirstResponse('ticket-1');

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'sla-response' }),
      );
    });
  });
});
