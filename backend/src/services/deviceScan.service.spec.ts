import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeviceScanService } from './deviceScan.service';
import { DeviceScan } from 'src/entities/deviceScan.entity';

const makeScan = (overrides: any = {}): DeviceScan =>
  ({
    id: 'scan-1',
    deviceId: 'dev-1',
    receivedAt: new Date('2024-01-01'),
    snapshotSha256: 'abc',
    system: { os_version: 'Win11' },
    hardware: null,
    software: null,
    network: null,
    security: null,
    peripherals: null,
    users: null,
    eventLogs: null,
    ...overrides,
  } as DeviceScan);

describe('DeviceScanService', () => {
  let service: DeviceScanService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (s: any) => s),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceScanService,
        { provide: getRepositoryToken(DeviceScan), useValue: repo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<DeviceScanService>(DeviceScanService);
  });

  describe('record', () => {
    it('saves a new scan and returns it', async () => {
      const saved = makeScan();
      repo.save.mockResolvedValue(saved);
      const result = await service.record('dev-1', { system: { os_version: 'Win11' } });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toBe(saved);
    });

    it('computes a deterministic SHA256 snapshot hash', async () => {
      repo.save.mockImplementation(async (s: any) => s);
      const r1 = await service.record('dev-1', { system: { os: 'Win' } });
      const r2 = await service.record('dev-1', { system: { os: 'Win' } });
      expect(r1.snapshotSha256).toBe(r2.snapshotSha256);
    });

    it('produces different hashes for different payloads', async () => {
      repo.save.mockImplementation(async (s: any) => s);
      const r1 = await service.record('dev-1', { system: { os: 'Win10' } });
      const r2 = await service.record('dev-1', { system: { os: 'Win11' } });
      expect(r1.snapshotSha256).not.toBe(r2.snapshotSha256);
    });

    it('skips inserting a new row when the snapshot is unchanged from the last one', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.save.mockImplementation(async (s: any) => s);
      const first = await service.record('dev-1', { system: { os: 'Win11' } });

      repo.save.mockClear();
      repo.findOne.mockResolvedValue(first);
      const second = await service.record('dev-1', { system: { os: 'Win11' } });

      expect(repo.save).not.toHaveBeenCalled();
      expect(second).toBe(first);
    });

    it('still inserts when the snapshot differs from the last one', async () => {
      const previous = makeScan({ snapshotSha256: 'stale-hash' });
      repo.findOne.mockResolvedValue(previous);
      repo.save.mockImplementation(async (s: any) => s);
      const result = await service.record('dev-1', { system: { os: 'Win11' } });
      expect(repo.save).toHaveBeenCalled();
      expect(result).not.toBe(previous);
    });
  });

  describe('listForDevice', () => {
    it('returns scans from query builder', async () => {
      const scans = [makeScan()];
      repo.createQueryBuilder().getMany.mockResolvedValue(scans);
      const result = await service.listForDevice('dev-1');
      expect(result).toBe(scans);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when scan not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findById('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns the scan when found', async () => {
      const scan = makeScan();
      repo.findOneBy.mockResolvedValue(scan);
      const result = await service.findById('scan-1');
      expect(result).toBe(scan);
    });
  });

  describe('diffLatestTwo', () => {
    it('returns null when fewer than 2 scans exist', async () => {
      repo.find.mockResolvedValue([makeScan()]);
      const result = await service.diffLatestTwo('dev-1');
      expect(result).toBeNull();
    });

    it('returns null when no scans exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.diffLatestTwo('dev-1');
      expect(result).toBeNull();
    });

    it('returns a ScanDiff with changedSections when data differs', async () => {
      const older = makeScan({ id: 'scan-1', system: { os_version: 'Win10' }, software: null });
      const newer = makeScan({ id: 'scan-2', system: { os_version: 'Win11' }, software: null });
      repo.find.mockResolvedValue([newer, older]); // DESC order: newer first
      const diff = await service.diffLatestTwo('dev-1');
      expect(diff).not.toBeNull();
      expect(diff!.changedSections).toContain('system');
    });

    it('returns empty changedSections when scans are identical', async () => {
      const scan = makeScan({ id: 'scan-1', system: { os_version: 'Win11' } });
      const scan2 = makeScan({ id: 'scan-2', system: { os_version: 'Win11' } });
      repo.find.mockResolvedValue([scan, scan2]);
      const diff = await service.diffLatestTwo('dev-1');
      expect(diff!.changedSections).toHaveLength(0);
    });
  });

  describe('diffPair', () => {
    it('throws NotFoundException when either scan not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.diffPair('dev-1', 'scan-1', 'scan-2')).rejects.toThrow(NotFoundException);
    });

    it('returns software added/removed delta', async () => {
      const from = makeScan({
        id: 'scan-1',
        software: [{ name: 'Chrome', version: '119.0' }],
      });
      const to = makeScan({
        id: 'scan-2',
        software: [{ name: 'Chrome', version: '120.0' }],
      });
      repo.findOneBy
        .mockResolvedValueOnce(from)
        .mockResolvedValueOnce(to);
      const diff = await service.diffPair('dev-1', 'scan-1', 'scan-2');
      expect(diff.software.versionChanged.length).toBeGreaterThan(0);
    });
  });
});
