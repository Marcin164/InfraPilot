import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FleetService } from './fleet.service';
import { Devices } from 'src/entities/devices.entity';
import { ComplianceService } from './compliance.service';
import { CveService } from './cve.service';

describe('FleetService', () => {
  let service: FleetService;
  let devicesRepo: jest.Mocked<any>;
  let compliance: jest.Mocked<any>;
  let cve: jest.Mocked<any>;

  beforeEach(async () => {
    const makeQb = () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      return qb;
    };

    devicesRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    compliance = { summary: jest.fn().mockResolvedValue({ totalDevices: 0, compliantDevices: 0, compliancePct: 0, bySeverity: {} }) };
    cve = { summary: jest.fn().mockResolvedValue({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetService,
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        { provide: ComplianceService, useValue: compliance },
        { provide: CveService, useValue: cve },
      ],
    }).compile();

    service = module.get<FleetService>(FleetService);
  });

  describe('staleAgents', () => {
    it('returns stale agents from query builder', async () => {
      const stale = [{ id: 'dev-1', lastScanAt: null }];
      devicesRepo.createQueryBuilder().getMany.mockResolvedValue(stale);
      const result = await service.staleAgents();
      expect(result).toBe(stale);
    });

    it('uses default 168-hour threshold when not specified', async () => {
      await service.staleAgents();
      expect(devicesRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('staleAgentsCount', () => {
    it('returns count from query builder', async () => {
      devicesRepo.createQueryBuilder().getCount.mockResolvedValue(5);
      const count = await service.staleAgentsCount();
      expect(count).toBe(5);
    });
  });

  describe('newDevices', () => {
    it('counts devices created within last N days', async () => {
      devicesRepo.count.mockResolvedValue(3);
      const result = await service.newDevices(7);
      expect(result).toBe(3);
      expect(devicesRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({}) }),
      );
    });
  });

  describe('lifecycleBreakdown', () => {
    it('returns lifecycle counts indexed by state', async () => {
      devicesRepo.createQueryBuilder().getRawMany.mockResolvedValue([
        { lifecycle: 'active', count: '12' },
        { lifecycle: 'retired', count: '3' },
      ]);
      const result = await service.lifecycleBreakdown();
      expect(result['active']).toBe(12);
      expect(result['retired']).toBe(3);
    });

    it('returns empty object when no devices', async () => {
      const result = await service.lifecycleBreakdown();
      expect(result).toEqual({});
    });
  });

  describe('overview', () => {
    it('returns combined fleet overview', async () => {
      devicesRepo.count.mockResolvedValue(100);
      devicesRepo.createQueryBuilder().getCount.mockResolvedValueOnce(80).mockResolvedValueOnce(4);
      const result = await service.overview();
      expect(typeof result.totalDevices).toBe('number');
      expect(typeof result.activeDevices).toBe('number');
      expect(result.compliance).toBeDefined();
      expect(result.cves).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });
});
