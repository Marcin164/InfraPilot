import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EscalationCreatorService } from './escalationCreator.service';
import { SlaEscalationDefinition } from 'src/entities/slaEscalationDefinition.entity';
import { SlaEscalationInstance } from 'src/entities/slaEscalationInstance.entity';
import { BusinessTimeService } from './businessTime.service';
import { SlaInstance } from 'src/entities/slaInstance.entity';

const calendar = { id: 'cal-1' } as any;

const makeSlaInstance = (overrides: Partial<SlaInstance> = {}): SlaInstance =>
  ({
    id: 'sla-inst-1',
    startAt: new Date('2024-01-08T09:00:00Z'),
    dueAt: new Date('2024-01-08T11:00:00Z'),
    slaDefinition: {
      id: 'def-1',
      targetMinutes: 120,
      calendar,
    },
    ...overrides,
  } as SlaInstance);

const makeEscalationDef = (overrides: any = {}) => ({
  id: 'esc-def-1',
  triggerPercentage: 75,
  actionType: 'notify_supervisor',
  ...overrides,
});

describe('EscalationCreatorService', () => {
  let service: EscalationCreatorService;
  let escalationDefRepo: jest.Mocked<any>;
  let escalationInstRepo: jest.Mocked<any>;
  let businessTime: jest.Mocked<BusinessTimeService>;

  beforeEach(async () => {
    escalationDefRepo = { find: jest.fn().mockResolvedValue([]) };
    escalationInstRepo = { save: jest.fn(async (inst: any) => ({ id: 'esc-inst-1', ...inst })) };
    businessTime = {
      calculateDueDate: jest.fn().mockResolvedValue(new Date('2024-01-08T10:30:00Z')),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationCreatorService,
        { provide: getRepositoryToken(SlaEscalationDefinition), useValue: escalationDefRepo },
        { provide: getRepositoryToken(SlaEscalationInstance), useValue: escalationInstRepo },
        { provide: BusinessTimeService, useValue: businessTime },
      ],
    }).compile();

    service = module.get<EscalationCreatorService>(EscalationCreatorService);
  });

  describe('createForSlaInstance', () => {
    it('does nothing when no escalation definitions exist', async () => {
      escalationDefRepo.find.mockResolvedValue([]);
      await service.createForSlaInstance(makeSlaInstance());
      expect(escalationInstRepo.save).not.toHaveBeenCalled();
    });

    it('creates an escalation instance for each definition', async () => {
      escalationDefRepo.find.mockResolvedValue([
        makeEscalationDef(),
        makeEscalationDef({ id: 'esc-def-2', triggerPercentage: 100 }),
      ]);

      await service.createForSlaInstance(makeSlaInstance());

      expect(escalationInstRepo.save).toHaveBeenCalledTimes(2);
    });

    it('calculates triggerAt based on percentage of targetMinutes', async () => {
      const def = makeEscalationDef({ triggerPercentage: 50 });
      escalationDefRepo.find.mockResolvedValue([def]);
      const inst = makeSlaInstance();

      await service.createForSlaInstance(inst);

      // 50% of 120 = 60 minutes
      expect(businessTime.calculateDueDate).toHaveBeenCalledWith(
        inst.startAt,
        60, // 120 * 50 / 100
        calendar,
      );
    });

    it('saves triggerAt from businessTime.calculateDueDate', async () => {
      const triggerDate = new Date('2024-01-08T10:00:00Z');
      businessTime.calculateDueDate.mockResolvedValue(triggerDate);
      escalationDefRepo.find.mockResolvedValue([makeEscalationDef()]);

      await service.createForSlaInstance(makeSlaInstance());

      expect(escalationInstRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ triggerAt: triggerDate }),
      );
    });

    it('uses provided manager repos instead of injected ones', async () => {
      const managerDefRepo = { find: jest.fn().mockResolvedValue([]) };
      const managerInstRepo = { save: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockImplementation((entity: any) => {
          if (entity === SlaEscalationDefinition) return managerDefRepo;
          return managerInstRepo;
        }),
      };

      await service.createForSlaInstance(makeSlaInstance(), manager);

      expect(escalationDefRepo.find).not.toHaveBeenCalled();
      expect(managerDefRepo.find).toHaveBeenCalled();
    });
  });
});
