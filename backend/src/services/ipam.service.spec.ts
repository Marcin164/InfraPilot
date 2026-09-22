import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IpamService } from './ipam.service';
import { Subnet } from 'src/entities/subnet.entity';
import { IpAllocation, IpAllocationSource, IpAllocationStatus } from 'src/entities/ipAllocation.entity';
import { Devices } from 'src/entities/devices.entity';

describe('IpamService', () => {
  let service: IpamService;
  let subnets: jest.Mocked<any>;
  let allocations: jest.Mocked<any>;
  let devices: jest.Mocked<any>;

  beforeEach(async () => {
    subnets = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    allocations = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (a: any) => a),
    };
    devices = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpamService,
        { provide: getRepositoryToken(Subnet), useValue: subnets },
        { provide: getRepositoryToken(IpAllocation), useValue: allocations },
        { provide: getRepositoryToken(Devices), useValue: devices },
      ],
    }).compile();

    service = module.get<IpamService>(IpamService);
  });

  // ─────────────────────────────────────────
  // ingestDiscovery
  // ─────────────────────────────────────────

  describe('ingestDiscovery', () => {
    it('creates a new scan-sourced allocation for a previously unseen host', async () => {
      allocations.findOneBy.mockResolvedValue(null);

      const { upserted } = await service.ingestDiscovery({
        cidr: '192.168.1.0/24',
        subnetId: 'subnet-1',
        hosts: [{ ip: '192.168.1.10', mac: 'AA:BB', hostname: 'host-a' }],
      });

      expect(upserted).toBe(1);
      expect(allocations.findOneBy).toHaveBeenCalledWith({
        ip: '192.168.1.10',
        source: IpAllocationSource.SCAN,
      });
      expect(allocations.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '192.168.1.10',
          subnetId: 'subnet-1',
          source: IpAllocationSource.SCAN,
          status: IpAllocationStatus.ASSIGNED,
          deviceId: null,
        }),
      );
    });

    it('updates the existing scan row for a host seen again, without touching identity beyond hostname/mac/lastSeenAt', async () => {
      const existing: any = {
        id: 'alloc-1',
        ip: '192.168.1.10',
        subnetId: null,
        hostname: 'old-name',
        macAddress: null,
        source: IpAllocationSource.SCAN,
      };
      allocations.findOneBy.mockResolvedValue(existing);

      await service.ingestDiscovery({
        cidr: '192.168.1.0/24',
        subnetId: 'subnet-1',
        hosts: [{ ip: '192.168.1.10', mac: 'CC:DD', hostname: 'new-name' }],
      });

      expect(allocations.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'alloc-1', hostname: 'new-name', macAddress: 'CC:DD' }),
      );
    });

    it('only ever queries/writes source: scan rows -- a manual/sync allocation for the same IP is never looked up as a target', async () => {
      allocations.findOneBy.mockResolvedValue(null);

      await service.ingestDiscovery({
        cidr: '10.0.0.0/24',
        hosts: [{ ip: '10.0.0.5' }],
      });

      // Every lookup this method performs is scoped to source: scan --
      // a manual/sync row for 10.0.0.5 is structurally unreachable here.
      for (const call of allocations.findOneBy.mock.calls) {
        expect(call[0].source).toBe(IpAllocationSource.SCAN);
      }
    });

    it('skips malformed IPs rather than failing the whole batch', async () => {
      const { upserted } = await service.ingestDiscovery({
        cidr: '10.0.0.0/24',
        hosts: [{ ip: 'not-an-ip' }, { ip: '10.0.0.5' }],
      });

      expect(upserted).toBe(1);
      expect(allocations.save).toHaveBeenCalledTimes(1);
    });

    it('falls back to matching the subnet by cidr when no subnetId is given', async () => {
      subnets.findOneBy.mockResolvedValue({ id: 'subnet-9', cidr: '10.0.0.0/24' });

      await service.ingestDiscovery({
        cidr: '10.0.0.0/24',
        hosts: [{ ip: '10.0.0.5' }],
      });

      expect(subnets.findOneBy).toHaveBeenCalledWith({ cidr: '10.0.0.0/24' });
      expect(allocations.create).toHaveBeenCalledWith(
        expect.objectContaining({ subnetId: 'subnet-9' }),
      );
    });
  });

  // ─────────────────────────────────────────
  // findScanCandidates
  // ─────────────────────────────────────────

  describe('findScanCandidates', () => {
    it('prefers an agent whose own NIC IP falls inside the subnet CIDR, even with no matching location', async () => {
      subnets.findOneBy.mockResolvedValue({ id: 'subnet-1', cidr: '192.168.1.0/24', locationId: null });
      devices.find.mockResolvedValue([
        { id: 'device-in-range', locationId: null, network: { nic_config: [{ IPv4Address: '192.168.1.50' }] } },
        { id: 'device-out-of-range', locationId: null, network: { nic_config: [{ IPv4Address: '10.0.0.5' }] } },
      ]);

      const result = await service.findScanCandidates('subnet-1');

      expect(devices.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ platform: 'windows' }),
        }),
      );
      expect(result).toEqual([
        { id: 'device-in-range', locationId: null, network: { nic_config: [{ IPv4Address: '192.168.1.50' }] } },
      ]);
    });

    it('falls back to a location match when no agent IP is inside the subnet', async () => {
      subnets.findOneBy.mockResolvedValue({ id: 'subnet-1', cidr: '192.168.1.0/24', locationId: 'loc-1' });
      devices.find.mockResolvedValue([
        { id: 'device-right-location', locationId: 'loc-1', network: null },
        { id: 'device-wrong-location', locationId: 'loc-2', network: null },
      ]);

      const result = await service.findScanCandidates('subnet-1');

      expect(result).toEqual([{ id: 'device-right-location', locationId: 'loc-1', network: null }]);
    });

    it('returns an empty list when neither an IP match nor a location match exists', async () => {
      subnets.findOneBy.mockResolvedValue({ id: 'subnet-1', cidr: '192.168.1.0/24', locationId: null });
      devices.find.mockResolvedValue([{ id: 'device-elsewhere', locationId: null, network: null }]);

      const result = await service.findScanCandidates('subnet-1');
      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────
  // findAllWindowsAgents
  // ─────────────────────────────────────────

  describe('findAllWindowsAgents', () => {
    it('returns every enrolled windows agent, unfiltered by subnet', async () => {
      devices.find.mockResolvedValue([{ id: 'agent-1' }, { id: 'agent-2' }]);

      const result = await service.findAllWindowsAgents();

      expect(devices.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ platform: 'windows' }),
        }),
      );
      expect(result).toEqual([{ id: 'agent-1' }, { id: 'agent-2' }]);
    });
  });
});
