import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SlaRuleService } from './slaRule.service';
import { SlaRule } from 'src/entities/slaRule.entity';
import { SlaDefinition } from 'src/entities/slaDefinition.entity';

const makeRule = (overrides: any = {}): SlaRule =>
  ({ id: 'rule-1', priority: 'High', ticketType: null, slaDefinition: { id: 'def-1' }, ...overrides } as SlaRule);

const makeDef = (): SlaDefinition =>
  ({ id: 'def-1', name: 'Response SLA', targetMinutes: 120 } as SlaDefinition);

describe('SlaRuleService', () => {
  let service: SlaRuleService;
  let ruleRepo: jest.Mocked<any>;
  let slaRepo: jest.Mocked<any>;

  beforeEach(async () => {
    ruleRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (r: any) => r),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    slaRepo = {
      findOne: jest.fn().mockResolvedValue(makeDef()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaRuleService,
        { provide: getRepositoryToken(SlaRule), useValue: ruleRepo },
        { provide: getRepositoryToken(SlaDefinition), useValue: slaRepo },
      ],
    }).compile();

    service = module.get<SlaRuleService>(SlaRuleService);
  });

  describe('getAll', () => {
    it('returns all rules with slaDefinition relation', async () => {
      const rules = [makeRule()];
      ruleRepo.find.mockResolvedValue(rules);
      const result = await service.getAll();
      expect(result).toBe(rules);
    });
  });

  describe('create', () => {
    it('throws NotFoundException when SLA definition not found', async () => {
      slaRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ priority: 'High' as any, definitionId: 'ghost' })).rejects.toThrow(NotFoundException);
    });

    it('deletes existing rule for same priority before creating new one', async () => {
      await service.create({ priority: 'High' as any, definitionId: 'def-1' });
      expect(ruleRepo.delete).toHaveBeenCalledWith({ priority: 'High' });
    });

    it('creates and saves the new rule', async () => {
      await service.create({ priority: 'High' as any, definitionId: 'def-1' });
      expect(ruleRepo.create).toHaveBeenCalled();
      expect(ruleRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when rule not found', async () => {
      ruleRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost', { ticketType: 'Incident' as any })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when new definitionId does not resolve', async () => {
      ruleRepo.findOne.mockResolvedValue(makeRule());
      slaRepo.findOne.mockResolvedValue(null);
      await expect(service.update('rule-1', { ticketType: 'Incident' as any, definitionId: 'ghost' })).rejects.toThrow(NotFoundException);
    });

    it('updates priority when provided', async () => {
      const rule = makeRule() as any;
      ruleRepo.findOne.mockResolvedValue(rule);
      await service.update('rule-1', { priority: 'Low' as any, ticketType: 'Incident' as any });
      expect(rule.priority).toBe('Low');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when rule not found', async () => {
      ruleRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes the rule and returns deleted:true', async () => {
      ruleRepo.findOne.mockResolvedValue(makeRule());
      const result = await service.delete('rule-1');
      expect(ruleRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });
});
