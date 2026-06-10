import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EscalationEngineService } from './escalationEngine.service';
import { SlaEscalationInstance } from 'src/entities/slaEscalationInstance.entity';
import { EscalationActionService } from './escalationAction.service';
import { AuditService } from './audit.service';

const makeEscalation = (overrides: any = {}): SlaEscalationInstance =>
  ({
    id: 'esc-1',
    triggered: false,
    triggeredAt: null,
    definition: { actionType: 'NOTIFY', actionConfig: {} },
    slaInstance: { ticketId: 'ticket-1', paused: false },
    ...overrides,
  } as SlaEscalationInstance);

describe('EscalationEngineService', () => {
  let service: EscalationEngineService;
  let repo: jest.Mocked<any>;
  let actionService: jest.Mocked<any>;
  let audit: jest.Mocked<any>;

  const buildQb = (escalations: SlaEscalationInstance[]) => ({
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(escalations),
  });

  const buildQueryRunner = (escalations: SlaEscalationInstance[]) => ({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      createQueryBuilder: jest.fn().mockReturnValue(buildQb(escalations)),
      save: jest.fn().mockResolvedValue(undefined),
    },
  });

  beforeEach(async () => {
    const qr = buildQueryRunner([]);

    repo = {
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(qr),
        },
      },
    };
    actionService = { execute: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationEngineService,
        { provide: getRepositoryToken(SlaEscalationInstance), useValue: repo },
        { provide: EscalationActionService, useValue: actionService },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<EscalationEngineService>(EscalationEngineService);
  });

  describe('processDueEscalations', () => {
    it('does nothing when no due escalations', async () => {
      await service.processDueEscalations();
      expect(actionService.execute).not.toHaveBeenCalled();
    });

    it('executes action and marks escalation as triggered', async () => {
      const esc = makeEscalation();
      const qr = buildQueryRunner([esc]);
      repo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await service.processDueEscalations();

      expect(actionService.execute).toHaveBeenCalledWith(esc);
      expect(esc.triggered).toBe(true);
      expect(esc.triggeredAt).toBeInstanceOf(Date);
      expect(qr.manager.save).toHaveBeenCalled();
    });

    it('logs audit event for each processed escalation', async () => {
      const esc = makeEscalation();
      const qr = buildQueryRunner([esc]);
      repo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await service.processDueEscalations();

      expect(audit.log).toHaveBeenCalledWith(
        'ESCALATION_INSTANCE',
        'esc-1',
        'ESCALATION_TRIGGERED',
        expect.any(Object),
        qr.manager,
      );
    });

    it('rolls back transaction and rethrows on error', async () => {
      const esc = makeEscalation();
      const qr = buildQueryRunner([esc]);
      repo.manager.connection.createQueryRunner.mockReturnValue(qr);
      actionService.execute.mockRejectedValue(new Error('action failed'));

      await expect(service.processDueEscalations()).rejects.toThrow('action failed');
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it('releases query runner in finally block even on error', async () => {
      const esc = makeEscalation();
      const qr = buildQueryRunner([esc]);
      repo.manager.connection.createQueryRunner.mockReturnValue(qr);
      actionService.execute.mockRejectedValue(new Error('fail'));

      await expect(service.processDueEscalations()).rejects.toThrow();
      expect(qr.release).toHaveBeenCalled();
    });
  });
});
