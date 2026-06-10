import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlaCreatorService } from './slaCreator.service';
import { SlaRule } from 'src/entities/slaRule.entity';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { BusinessTimeService } from './businessTime.service';
import { EscalationCreatorService } from './escalationCreator.service';
import { AuditService } from './audit.service';
import { Tickets } from 'src/entities/tickets.entity';

const calendar = { id: 'cal-1' } as any;

const makeSlaDefinition = (overrides: any = {}) => ({
  id: 'def-1',
  targetMinutes: 120,
  calendar,
  ...overrides,
});

const makeSlaRule = (overrides: any = {}) => ({
  id: 'rule-1',
  priority: 'High',
  ticketType: null,
  slaDefinition: makeSlaDefinition(),
  ...overrides,
});

const makeTicket = (overrides: Partial<Tickets> = {}): Tickets =>
  ({
    id: 'ticket-1',
    priority: 'High',
    type: 'Incident',
    createdAt: new Date('2024-01-08T09:00:00Z'),
    ...overrides,
  } as Tickets);

describe('SlaCreatorService', () => {
  let service: SlaCreatorService;
  let slaRuleRepo: jest.Mocked<any>;
  let slaInstanceRepo: jest.Mocked<any>;
  let businessTime: jest.Mocked<BusinessTimeService>;
  let escalationCreator: jest.Mocked<EscalationCreatorService>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(async () => {
    slaRuleRepo = { find: jest.fn().mockResolvedValue([]) };
    slaInstanceRepo = {
      save: jest.fn().mockImplementation(async (inst: any) => ({ id: 'sla-inst-1', ...inst })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    businessTime = {
      calculateDueDate: jest.fn().mockResolvedValue(new Date('2024-01-08T11:00:00Z')),
    } as any;
    escalationCreator = {
      createForSlaInstance: jest.fn().mockResolvedValue(undefined),
    } as any;
    audit = { log: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaCreatorService,
        { provide: getRepositoryToken(SlaRule), useValue: slaRuleRepo },
        { provide: getRepositoryToken(SlaInstance), useValue: slaInstanceRepo },
        { provide: BusinessTimeService, useValue: businessTime },
        { provide: EscalationCreatorService, useValue: escalationCreator },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<SlaCreatorService>(SlaCreatorService);
  });

  // ─────────────────────────────────────────
  // createInstances
  // ─────────────────────────────────────────

  describe('createInstances', () => {
    it('does nothing when no matching rules exist', async () => {
      slaRuleRepo.find.mockResolvedValue([]);
      await service.createInstances(makeTicket());
      expect(slaInstanceRepo.save).not.toHaveBeenCalled();
    });

    it('creates an SLA instance for each matching rule', async () => {
      slaRuleRepo.find.mockResolvedValue([makeSlaRule(), makeSlaRule({ id: 'rule-2', slaDefinition: makeSlaDefinition({ id: 'def-2' }) })]);

      await service.createInstances(makeTicket());

      expect(slaInstanceRepo.save).toHaveBeenCalledTimes(2);
      expect(businessTime.calculateDueDate).toHaveBeenCalledTimes(2);
    });

    it('filters out rules whose ticketType does not match', async () => {
      const rules = [
        makeSlaRule({ ticketType: null }),        // matches all types
        makeSlaRule({ id: 'rule-change', ticketType: 'Change', slaDefinition: makeSlaDefinition({ id: 'def-change' }) }), // no match
      ];
      slaRuleRepo.find.mockResolvedValue(rules);

      await service.createInstances(makeTicket({ type: 'Incident' }));

      expect(slaInstanceRepo.save).toHaveBeenCalledTimes(1); // only the null-type rule
    });

    it('includes rules whose ticketType matches the ticket type', async () => {
      slaRuleRepo.find.mockResolvedValue([
        makeSlaRule({ ticketType: 'Incident' }),
      ]);

      await service.createInstances(makeTicket({ type: 'Incident' }));

      expect(slaInstanceRepo.save).toHaveBeenCalledTimes(1);
    });

    it('calls escalationCreator for each created instance', async () => {
      slaRuleRepo.find.mockResolvedValue([makeSlaRule()]);
      await service.createInstances(makeTicket());
      expect(escalationCreator.createForSlaInstance).toHaveBeenCalledTimes(1);
    });

    it('logs SLA_CREATED audit for each created instance', async () => {
      slaRuleRepo.find.mockResolvedValue([makeSlaRule()]);
      await service.createInstances(makeTicket());
      expect(audit.log).toHaveBeenCalledWith(
        'SLA_INSTANCE',
        'sla-inst-1',
        'SLA_CREATED',
        expect.any(Object),
        undefined,
      );
    });

    it('uses provided manager repos instead of injected ones', async () => {
      const managerRuleRepo = { find: jest.fn().mockResolvedValue([]) };
      const managerInstRepo = { save: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockImplementation((entity: any) => {
          if (entity === SlaRule) return managerRuleRepo;
          return managerInstRepo;
        }),
      };

      await service.createInstances(makeTicket(), manager);

      expect(slaRuleRepo.find).not.toHaveBeenCalled();
      expect(managerRuleRepo.find).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // deleteInstancesForTicket
  // ─────────────────────────────────────────

  describe('deleteInstancesForTicket', () => {
    it('deletes all SLA instances for the given ticket', async () => {
      await service.deleteInstancesForTicket('ticket-1');
      expect(slaInstanceRepo.delete).toHaveBeenCalledWith({ ticketId: 'ticket-1' });
    });

    it('logs audit event after deletion', async () => {
      await service.deleteInstancesForTicket('ticket-1');
      expect(audit.log).toHaveBeenCalledWith(
        'SLA_INSTANCE',
        'ticket-1',
        'SLA_RECREATED_AFTER_PRIORITY_CHANGE',
        {},
        undefined,
      );
    });
  });
});
