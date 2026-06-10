import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComplianceService, BUILTIN_RULES } from './compliance.service';
import { ComplianceRule } from 'src/entities/complianceRule.entity';
import { ComplianceResult } from 'src/entities/complianceResult.entity';
import { Devices } from 'src/entities/devices.entity';

const makeRule = (overrides: any = {}) => ({
  key: 'bitlocker-enabled',
  name: 'BitLocker',
  jsonPath: 'security.bitlocker.enabled',
  operator: 'eq',
  expected: true,
  severity: 'HIGH',
  enabled: true,
  ...overrides,
});

const makeDevice = (overrides: any = {}) =>
  ({ id: 'dev-1', security: { bitlocker: { enabled: true } }, system: { os_version: 'Windows 11' }, ...overrides } as Devices);

describe('ComplianceService', () => {
  let service: ComplianceService;
  let rulesRepo: jest.Mocked<any>;
  let resultsRepo: jest.Mocked<any>;
  let devicesRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const summaryQb: any = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
    };

    rulesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findBy: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (r: any) => r),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    resultsRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (r: any) => r),
      createQueryBuilder: jest.fn().mockReturnValue(summaryQb),
    };
    devicesRepo = {
      count: jest.fn().mockResolvedValue(0),
      findOneBy: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: getRepositoryToken(ComplianceRule), useValue: rulesRepo },
        { provide: getRepositoryToken(ComplianceResult), useValue: resultsRepo },
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  describe('BUILTIN_RULES', () => {
    it('includes 5 predefined rules', () => {
      expect(BUILTIN_RULES).toHaveLength(5);
    });

    it('includes bitlocker rule', () => {
      expect(BUILTIN_RULES.find((r) => r.key === 'bitlocker-enabled')).toBeDefined();
    });

    it('includes tpm rule', () => {
      expect(BUILTIN_RULES.find((r) => r.key === 'tpm-present')).toBeDefined();
    });
  });

  describe('seedBuiltins', () => {
    it('inserts rules that do not yet exist', async () => {
      rulesRepo.findOneBy.mockResolvedValue(null);
      const count = await service.seedBuiltins();
      expect(count).toBe(BUILTIN_RULES.length);
      expect(rulesRepo.save).toHaveBeenCalledTimes(BUILTIN_RULES.length);
    });

    it('skips rules that already exist', async () => {
      rulesRepo.findOneBy.mockResolvedValue({ key: 'bitlocker-enabled' });
      const count = await service.seedBuiltins();
      expect(count).toBe(0);
      expect(rulesRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('listRules', () => {
    it('returns rules ordered by category and key', async () => {
      const rules = [makeRule()];
      rulesRepo.find.mockResolvedValue(rules);
      const result = await service.listRules();
      expect(result).toBe(rules);
    });
  });

  describe('upsertRule', () => {
    it('updates existing rule', async () => {
      const existing = makeRule() as any;
      rulesRepo.findOneBy.mockResolvedValue(existing);
      await service.upsertRule({ key: 'bitlocker-enabled', expected: false } as any);
      expect(existing.expected).toBe(false);
      expect(rulesRepo.save).toHaveBeenCalled();
    });

    it('creates new custom rule', async () => {
      rulesRepo.findOneBy.mockResolvedValue(null);
      await service.upsertRule({ key: 'custom-rule', operator: 'exists', expected: null } as any);
      expect(rulesRepo.create).toHaveBeenCalled();
      expect(rulesRepo.save).toHaveBeenCalled();
    });
  });

  describe('deleteRule', () => {
    it('does nothing when rule not found', async () => {
      await service.deleteRule('nonexistent');
      expect(rulesRepo.delete).not.toHaveBeenCalled();
    });

    it('throws when attempting to delete a builtin rule', async () => {
      rulesRepo.findOneBy.mockResolvedValue({ key: 'bitlocker-enabled', builtin: true });
      await expect(service.deleteRule('bitlocker-enabled')).rejects.toThrow('Cannot delete built-in rule');
    });

    it('deletes custom rule successfully', async () => {
      rulesRepo.findOneBy.mockResolvedValue({ key: 'custom', builtin: false });
      await service.deleteRule('custom');
      expect(rulesRepo.delete).toHaveBeenCalledWith({ key: 'custom' });
    });
  });

  describe('evaluateDevice', () => {
    it('returns empty array when device not found', async () => {
      devicesRepo.findOneBy.mockResolvedValue(null);
      const result = await service.evaluateDevice('ghost');
      expect(result).toEqual([]);
    });

    it('evaluates eq operator correctly (pass)', async () => {
      devicesRepo.findOneBy.mockResolvedValue(makeDevice());
      rulesRepo.findBy.mockResolvedValue([makeRule()]);
      const results = await service.evaluateDevice('dev-1');
      expect(results[0].passed).toBe(true);
    });

    it('evaluates eq operator correctly (fail)', async () => {
      devicesRepo.findOneBy.mockResolvedValue(makeDevice({ security: { bitlocker: { enabled: false } } }));
      rulesRepo.findBy.mockResolvedValue([makeRule()]);
      const results = await service.evaluateDevice('dev-1');
      expect(results[0].passed).toBe(false);
    });

    it('evaluates exists operator correctly', async () => {
      devicesRepo.findOneBy.mockResolvedValue(makeDevice());
      rulesRepo.findBy.mockResolvedValue([makeRule({ key: 'os-check', jsonPath: 'system.os_version', operator: 'exists', expected: null })]);
      const results = await service.evaluateDevice('dev-1');
      expect(results[0].passed).toBe(true);
    });

    it('evaluates gte operator correctly', async () => {
      devicesRepo.findOneBy.mockResolvedValue(makeDevice({ security: { score: 90 } }));
      rulesRepo.findBy.mockResolvedValue([makeRule({ key: 'score', jsonPath: 'security.score', operator: 'gte', expected: 80 })]);
      const results = await service.evaluateDevice('dev-1');
      expect(results[0].passed).toBe(true);
    });

    it('creates new result row when none exists', async () => {
      devicesRepo.findOneBy.mockResolvedValue(makeDevice());
      rulesRepo.findBy.mockResolvedValue([makeRule()]);
      resultsRepo.findOne.mockResolvedValue(null);
      await service.evaluateDevice('dev-1');
      expect(resultsRepo.save).toHaveBeenCalled();
    });

    it('updates existing result row when one exists', async () => {
      devicesRepo.findOneBy.mockResolvedValue(makeDevice());
      rulesRepo.findBy.mockResolvedValue([makeRule()]);
      resultsRepo.findOne.mockResolvedValue({ id: 'r-1', passed: false });
      await service.evaluateDevice('dev-1');
      expect(resultsRepo.save).toHaveBeenCalled();
    });
  });

  describe('summary', () => {
    it('returns zero stats when no data', async () => {
      const result = await service.summary();
      expect(result.totalDevices).toBe(0);
      expect(result.compliantDevices).toBe(0);
      expect(result.compliancePct).toBe(0);
    });

    it('calculates compliancePct correctly', async () => {
      devicesRepo.count.mockResolvedValue(10);
      resultsRepo.createQueryBuilder().getRawOne.mockResolvedValue({ count: '8' });
      const result = await service.summary();
      expect(result.compliancePct).toBe(80);
    });
  });
});
