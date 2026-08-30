import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaseSyncService } from './leaseSync.service';
import { DhcpServer, DhcpDriverType, DhcpSyncStatus } from 'src/entities/dhcpServer.entity';
import { IpAllocation, IpAllocationSource, IpAllocationStatus } from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { DhcpDriverRegistry } from 'src/dhcp/dhcpDriver.registry';
import { AuditService } from './audit.service';
import { IpamService } from './ipam.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';

describe('LeaseSyncService.runSync', () => {
  let service: LeaseSyncService;
  let sourcesRepo: jest.Mocked<any>;
  let allocationsRepo: jest.Mocked<any>;
  let subnetsRepo: jest.Mocked<any>;
  let adminSettingsRepo: jest.Mocked<any>;
  let driver: { type: DhcpDriverType; fetchLeases: jest.Mock };
  let registry: { getDriver: jest.Mock };
  let auditService: { log: jest.Mock };
  let ipamService: { getConflicts: jest.Mock };
  let dispatcher: { dispatchOpsAlert: jest.Mock };

  const SOURCE: DhcpServer = {
    id: 'src-1',
    name: 'Core MikroTik',
    driverType: DhcpDriverType.SSH_SCRAPE,
    deviceId: 'dev-1',
    config: {},
  } as any;

  beforeEach(async () => {
    sourcesRepo = { findOneBy: jest.fn().mockResolvedValue({ ...SOURCE }), save: jest.fn().mockImplementation((s) => Promise.resolve(s)) };
    allocationsRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((v: any) => v),
      save: jest.fn().mockImplementation((a: any) => Promise.resolve(a)),
    };
    subnetsRepo = { find: jest.fn().mockResolvedValue([{ id: 'subnet-1', cidr: '192.168.1.0/24' }]) };
    adminSettingsRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    driver = { type: DhcpDriverType.SSH_SCRAPE, fetchLeases: jest.fn().mockResolvedValue([]) };
    registry = { getDriver: jest.fn().mockReturnValue(driver) };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    ipamService = { getConflicts: jest.fn().mockResolvedValue([]) };
    dispatcher = { dispatchOpsAlert: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaseSyncService,
        { provide: getRepositoryToken(DhcpServer), useValue: sourcesRepo },
        { provide: getRepositoryToken(IpAllocation), useValue: allocationsRepo },
        { provide: getRepositoryToken(Subnet), useValue: subnetsRepo },
        { provide: getRepositoryToken(AdminSettings), useValue: adminSettingsRepo },
        { provide: DhcpDriverRegistry, useValue: registry },
        { provide: AuditService, useValue: auditService },
        { provide: IpamService, useValue: ipamService },
        { provide: NotificationDispatcherService, useValue: dispatcher },
      ],
    }).compile();

    service = module.get(LeaseSyncService);
  });

  it('upserts a new IpAllocation row keyed by ip + dhcpServerId, matching it to the right subnet', async () => {
    driver.fetchLeases.mockResolvedValue([{ ip: '192.168.1.50', mac: 'aa:bb:cc:dd:ee:ff', hostname: 'host-a', expiry: '1d' }]);

    const result = await service.runSync('src-1');

    expect(result.recordsFound).toBe(1);
    expect(allocationsRepo.findOne).toHaveBeenCalledWith({ where: { ip: '192.168.1.50', dhcpServerId: 'src-1' } });
    expect(allocationsRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      ip: '192.168.1.50',
      subnetId: 'subnet-1',
      status: IpAllocationStatus.LEASED,
      source: IpAllocationSource.SYNC,
      dhcpServerId: 'src-1',
      macAddress: 'aa:bb:cc:dd:ee:ff',
      hostname: 'host-a',
      leaseExpiresRaw: '1d',
    }));
  });

  it('updates an existing row instead of creating a duplicate for the same source', async () => {
    const existing = { id: 'alloc-1', ip: '192.168.1.50', dhcpServerId: 'src-1' };
    allocationsRepo.findOne.mockResolvedValue(existing);
    driver.fetchLeases.mockResolvedValue([{ ip: '192.168.1.50', hostname: 'host-a' }]);

    await service.runSync('src-1');

    expect(allocationsRepo.create).not.toHaveBeenCalled();
    expect(allocationsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'alloc-1' }));
  });

  it('marks the source as succeeded and records the count on success', async () => {
    driver.fetchLeases.mockResolvedValue([{ ip: '192.168.1.50' }]);

    await service.runSync('src-1');

    expect(sourcesRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      lastSyncStatus: DhcpSyncStatus.SUCCESS,
      lastSyncRecordCount: 1,
      lastSyncError: null,
    }));
    expect(auditService.log).toHaveBeenCalledWith('DHCP_SERVER_LEASE_SYNC', 'src-1', 'SUCCEEDED', expect.objectContaining({ recordsFound: 1 }));
  });

  it('marks the source as failed and rethrows when the driver fails', async () => {
    driver.fetchLeases.mockRejectedValue(new Error('ssh timeout'));

    await expect(service.runSync('src-1')).rejects.toThrow('Lease sync failed: ssh timeout');

    expect(sourcesRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      lastSyncStatus: DhcpSyncStatus.FAILED,
      lastSyncError: 'ssh timeout',
    }));
    expect(auditService.log).toHaveBeenCalledWith('DHCP_SERVER_LEASE_SYNC', 'src-1', 'FAILED', expect.objectContaining({ error: 'ssh timeout' }));
  });

  it('throws when the DHCP server does not exist', async () => {
    sourcesRepo.findOneBy.mockResolvedValue(null);
    await expect(service.runSync('missing')).rejects.toThrow('DHCP server not found');
  });

  it('only notifies about conflicts not already known from the last sync', async () => {
    ipamService.getConflicts.mockResolvedValue([
      { ip: '10.0.0.1', owners: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }] },
      { ip: '10.0.0.2', owners: [{ key: 'c', label: 'C' }, { key: 'd', label: 'D' }] },
    ]);
    adminSettingsRepo.findOne.mockResolvedValue({ key: 'ipam.lastKnownConflicts', value: ['10.0.0.1'] });
    driver.fetchLeases.mockResolvedValue([]);

    await service.runSync('src-1');

    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledTimes(1);
    expect(dispatcher.dispatchOpsAlert).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('10.0.0.2') }));
  });
});
