import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { HistoriesService } from './histories.service';
import { Histories } from 'src/entities/histories.entity';
import { HistoryApprovers } from 'src/entities/historyApprovers.entity';
import { HistoryComponents } from 'src/entities/historyComponents.entity';
import { AuditService } from './audit.service';

const makeHistory = (overrides: any = {}): any => ({
  id: 'h-1',
  date: '2024-01-15',
  type: 0,
  details: 'Owner changed',
  justification: 'Transfer',
  ticket: 'TKT-1',
  deviceId: 'dev-1',
  userId: 'user-1',
  isUserFault: false,
  fixes: '',
  damages: '',
  components: [],
  approvers: [],
  user: { distinguishedName: 'CN=Jan' },
  device: { assetName: 'PC-001', manufacturer: 'Dell', model: 'Latitude', serialNumber: 'SN123' },
  ...overrides,
});

describe('HistoriesService', () => {
  let service: HistoriesService;
  let historiesRepo: jest.Mocked<any>;
  let approvesRepo: jest.Mocked<any>;
  let componentsRepo: jest.Mocked<any>;
  let audit: jest.Mocked<any>;

  const buildFeedQb = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    // take returns the same qb so chaining works
    qb.take.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    const qb = buildFeedQb();

    historiesRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (h: any) => h),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    approvesRepo = { save: jest.fn().mockResolvedValue(undefined) };
    componentsRepo = { save: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoriesService,
        { provide: getRepositoryToken(Histories), useValue: historiesRepo },
        { provide: getRepositoryToken(HistoryApprovers), useValue: approvesRepo },
        { provide: getRepositoryToken(HistoryComponents), useValue: componentsRepo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<HistoriesService>(HistoriesService);
  });

  describe('findAll', () => {
    it('returns all histories', async () => {
      const histories = [makeHistory()];
      historiesRepo.find.mockResolvedValue(histories);
      const result = await service.findAll();
      expect(result).toBe(histories);
    });
  });

  describe('findFeed', () => {
    it('returns empty data and null nextCursor for empty result', async () => {
      const result = await service.findFeed({});
      expect(result.data).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });

    it('returns data shaped with component fields', async () => {
      const h = makeHistory({ components: [{ id: 'c-1', historyId: 'h-1', deviceId: 'dev-1', type: 'remove', device: { location: 'Rack A', manufacturer: 'HP', serialNumber: 'SN', assetName: 'Switch', group: 'Net', subgroup: 'Core', model: 'S2' } }] });
      historiesRepo.createQueryBuilder().getMany.mockResolvedValue([h]);
      const result = await service.findFeed({});
      expect(result.data[0].components[0].location).toBe('Rack A');
    });

    it('generates nextCursor when there are more rows than limit', async () => {
      const rows = Array.from({ length: 31 }, (_, i) =>
        makeHistory({ id: `h-${i}`, date: `2024-01-${String(i + 1).padStart(2, '0')}` }),
      );
      historiesRepo.createQueryBuilder().getMany.mockResolvedValue(rows);
      const result = await service.findFeed({ limit: 30 });
      expect(result.nextCursor).not.toBeNull();
      expect(result.data).toHaveLength(30);
    });

    it('throws BadRequestException for invalid cursor', async () => {
      await expect(service.findFeed({ cursor: 'not-valid-base64-json!!' }))
        .rejects.toThrow(BadRequestException);
    });

    it('accepts a valid base64 cursor', async () => {
      const cursor = Buffer.from(JSON.stringify({ date: '2024-01-10', id: 'h-5' }), 'utf8').toString('base64');
      historiesRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      const result = await service.findFeed({ cursor });
      expect(result.data).toEqual([]);
    });
  });

  describe('exportFeedCsv', () => {
    it('returns filename and csv string', async () => {
      historiesRepo.createQueryBuilder().getMany.mockResolvedValue([makeHistory()]);
      const result = await service.exportFeedCsv({});
      expect(result.filename).toMatch(/^history-export-.+\.csv$/);
      expect(typeof result.csv).toBe('string');
    });

    it('returns empty string csv when no rows exist', async () => {
      const result = await service.exportFeedCsv({});
      expect(typeof result.csv).toBe('string');
    });
  });

  describe('createHistory', () => {
    it('saves history and returns it', async () => {
      const saved = makeHistory();
      historiesRepo.save.mockResolvedValue(saved);
      const result = await service.createHistory({ userId: 'user-1', deviceId: 'dev-1', type: 0, date: '2024-01-15' });
      expect(historiesRepo.save).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalled();
      expect(result).toBe(saved);
    });

    it('saves approvers when provided', async () => {
      historiesRepo.save.mockResolvedValue(makeHistory());
      await service.createHistory({ type: 0, approvers: ['user-2', 'user-3'] });
      expect(approvesRepo.save).toHaveBeenCalled();
    });

    it('saves removed and added components for type 3', async () => {
      historiesRepo.save.mockResolvedValue(makeHistory({ type: 3 }));
      await service.createHistory({
        type: 3,
        removedComponents: [{ deviceId: 'dev-old' }],
        addedComponents: ['dev-new'],
      });
      expect(componentsRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('findDeviceHistory', () => {
    it('returns histories for a given device', async () => {
      const histories = [makeHistory()];
      historiesRepo.find.mockResolvedValue(histories);
      const result = await service.findDeviceHistory('dev-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findUserHistory', () => {
    it('returns histories for a given user via query builder', async () => {
      const histories = [makeHistory()];
      historiesRepo.createQueryBuilder().getMany.mockResolvedValue(histories);
      const result = await service.findUserHistory('user-1');
      expect(result).toBe(histories);
    });
  });
});
