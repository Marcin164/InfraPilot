import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { SlaRuleService } from './slaRule.service';
import { SlaRule } from 'src/entities/slaRule.entity';
import { SlaDefinition } from 'src/entities/slaDefinition.entity';

const makeRule = (overrides: any = {}): SlaRule =>
  ({ id: 'rule-1', priority: 'High', ticketType: null, slaDefinition: { id: 'def-1' }, ...overrides } as SlaRule);

const makeDef = (): SlaDefinition =>
  ({ id: 'def-1', name: 'Response SLA', responseMinutes: 120 } as SlaDefinition);

describe('SlaRuleService', () => {
  let service: SlaRuleService;
  let ruleRepo: jest.Mocked<any>;
  let slaRepo: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;
  let txRuleRepo: jest.Mocked<any>;
  let deleteExecute: jest.Mock;

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
      findBy: jest.fn().mockResolvedValue([makeDef()]),
    };

    deleteExecute = jest.fn().mockResolvedValue(undefined);
    txRuleRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        execute: deleteExecute,
      }),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn().mockImplementation(async (rows: any) => rows),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) =>
        cb({ getRepository: jest.fn().mockReturnValue(txRuleRepo) }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaRuleService,
        { provide: getRepositoryToken(SlaRule), useValue: ruleRepo },
        { provide: getRepositoryToken(SlaDefinition), useValue: slaRepo },
        { provide: DataSource, useValue: dataSource },
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

    it('deletes existing rule for the same (priority, ticketType) slot only, before creating new one', async () => {
      await service.create({ priority: 'High' as any, definitionId: 'def-1', ticketType: 'Incident' as any });
      expect(ruleRepo.delete).toHaveBeenCalledWith({ priority: 'High', ticketType: 'Incident' });
    });

    it('scopes the delete to ticketType null when no ticketType is given (does not touch other ticketType rows for the same priority)', async () => {
      await service.create({ priority: 'High' as any, definitionId: 'def-1' });
      expect(ruleRepo.delete).toHaveBeenCalledWith({ priority: 'High', ticketType: IsNull() });
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

  describe('replaceMatrix', () => {
    it('throws BadRequestException on duplicate (priority, ticketType) entries', async () => {
      await expect(
        service.replaceMatrix([
          { priority: 'High' as any, ticketType: 'Incident' as any, definitionId: 'def-1' },
          { priority: 'High' as any, ticketType: 'Incident' as any, definitionId: 'def-1' },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when a referenced definition does not exist', async () => {
      slaRepo.findBy.mockResolvedValue([]);
      await expect(
        service.replaceMatrix([{ priority: 'High' as any, definitionId: 'ghost' }]),
      ).rejects.toThrow(NotFoundException);
    });

    it('wipes existing rules and inserts the new set inside a transaction', async () => {
      await service.replaceMatrix([
        { priority: 'High' as any, ticketType: 'Incident' as any, definitionId: 'def-1' },
        { priority: 'Low' as any, definitionId: 'def-1' },
      ]);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(deleteExecute).toHaveBeenCalled();
      expect(txRuleRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ priority: 'High', ticketType: 'Incident' }),
        expect.objectContaining({ priority: 'Low', ticketType: null }),
      ]);
    });

    it('wipes all rules and saves nothing when entries is empty (clearing the whole grid)', async () => {
      const result = await service.replaceMatrix([]);
      expect(result).toEqual([]);
      expect(slaRepo.findBy).not.toHaveBeenCalled();
      expect(deleteExecute).toHaveBeenCalled();
      expect(txRuleRepo.save).not.toHaveBeenCalled();
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
