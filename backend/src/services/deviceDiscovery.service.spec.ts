import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DeviceDiscoveryService } from './deviceDiscovery.service';
import { DeviceTagsService } from './deviceTags.service';
import { NetworkScanSettingsService } from './networkScanSettings.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';
import { Devices } from 'src/entities/devices.entity';
import {
  IpAllocation,
  IpAllocationSource,
} from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';

describe('DeviceDiscoveryService', () => {
  let service: DeviceDiscoveryService;
  let devicesRepo: jest.Mocked<any>;
  let allocationsRepo: jest.Mocked<any>;
  let subnetsRepo: jest.Mocked<any>;
  let deviceTags: jest.Mocked<any>;
  let networkScanSettings: jest.Mocked<any>;
  let notificationDispatcher: jest.Mocked<any>;
  let qb: jest.Mocked<any>;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    devicesRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (d: any) => d),
    };
    allocationsRepo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    subnetsRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    deviceTags = {
      listTags: jest.fn().mockResolvedValue([]),
      createTag: jest.fn().mockResolvedValue({ id: 'tag-auto-discovered' }),
      attach: jest.fn().mockResolvedValue(1),
    };
    networkScanSettings = {
      getConfig: jest.fn().mockResolvedValue({ autoCreateDevices: true }),
    };
    notificationDispatcher = {
      dispatchOpsAlert: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceDiscoveryService,
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        {
          provide: getRepositoryToken(IpAllocation),
          useValue: allocationsRepo,
        },
        { provide: getRepositoryToken(Subnet), useValue: subnetsRepo },
        { provide: DeviceTagsService, useValue: deviceTags },
        { provide: NetworkScanSettingsService, useValue: networkScanSettings },
        {
          provide: NotificationDispatcherService,
          useValue: notificationDispatcher,
        },
      ],
    }).compile();

    service = module.get<DeviceDiscoveryService>(DeviceDiscoveryService);
  });

  it('skips hosts with no MAC entirely', async () => {
    await service.ingestScanResults([{ ip: '10.0.0.5', mac: null }], null);

    expect(devicesRepo.save).not.toHaveBeenCalled();
    expect(allocationsRepo.update).not.toHaveBeenCalled();
  });

  it('links to an existing device instead of creating a duplicate when the MAC matches', async () => {
    qb.getOne.mockResolvedValue({ id: 'device-existing' });

    await service.ingestScanResults(
      [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33', openPorts: [22] }],
      null,
    );

    expect(devicesRepo.save).not.toHaveBeenCalled();
    expect(deviceTags.attach).not.toHaveBeenCalled();
    expect(allocationsRepo.update).toHaveBeenCalledWith(
      { ip: '10.0.0.5', source: IpAllocationSource.SCAN },
      { deviceId: 'device-existing' },
    );
    expect(notificationDispatcher.dispatchOpsAlert).not.toHaveBeenCalled();
  });

  it('creates a new device, classifies it, tags it, and links the allocation when no match exists', async () => {
    devicesRepo.save.mockImplementation(async (d: any) => d);

    await service.ingestScanResults(
      [
        {
          ip: '10.0.0.5',
          mac: '00:1B:D4:11:22:33',
          hostname: 'sw-1',
          openPorts: [22],
          respondedToPing: true,
        },
      ],
      null,
    );

    expect(devicesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'Network',
        subgroup: 'Switch',
        assetName: 'sw-1',
        macAddresses: ['00:1B:D4:11:22:33'],
        managementIp: '10.0.0.5',
        isOn: true,
      }),
    );
    expect(deviceTags.createTag).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'auto-discovered' }),
    );
    expect(deviceTags.attach).toHaveBeenCalledWith(
      [expect.any(String)],
      ['tag-auto-discovered'],
      'system:network-scan',
    );
    expect(allocationsRepo.update).toHaveBeenCalledWith(
      { ip: '10.0.0.5', source: IpAllocationSource.SCAN },
      { deviceId: expect.any(String) },
    );
  });

  it('inherits the subnet location onto a newly created device', async () => {
    subnetsRepo.findOneBy.mockResolvedValue({
      id: 'subnet-1',
      locationId: 'loc-1',
    });

    await service.ingestScanResults(
      [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
      'subnet-1',
    );

    expect(devicesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ locationId: 'loc-1' }),
    );
  });

  it('reuses the auto-discovered tag on a second ingest instead of recreating it', async () => {
    deviceTags.listTags.mockResolvedValue([
      { id: 'tag-existing', key: 'auto-discovered' },
    ]);

    await service.ingestScanResults(
      [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
      null,
    );

    expect(deviceTags.createTag).not.toHaveBeenCalled();
    expect(deviceTags.attach).toHaveBeenCalledWith(
      [expect.any(String)],
      ['tag-existing'],
      'system:network-scan',
    );
  });

  it('recovers from a lost create-tag race by re-reading the tag that appeared concurrently', async () => {
    deviceTags.listTags
      .mockResolvedValueOnce([]) // first check: not there yet
      .mockResolvedValueOnce([
        { id: 'tag-from-other-request', key: 'auto-discovered' },
      ]); // retry after conflict
    deviceTags.createTag.mockRejectedValue(
      new BadRequestException('Tag key already exists'),
    );

    await service.ingestScanResults(
      [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
      null,
    );

    expect(deviceTags.attach).toHaveBeenCalledWith(
      [expect.any(String)],
      ['tag-from-other-request'],
      'system:network-scan',
    );
  });

  it('does not let one bad host stop the rest of the batch from being ingested', async () => {
    allocationsRepo.update
      .mockRejectedValueOnce(new Error('db hiccup'))
      .mockResolvedValueOnce({ affected: 1 });

    await service.ingestScanResults(
      [
        { ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' },
        { ip: '10.0.0.6', mac: '18:34:AF:11:22:33' },
      ],
      null,
    );

    expect(devicesRepo.save).toHaveBeenCalledTimes(2);
  });

  // ─────────────────────────────────────────
  // Settings > Network scanning toggle + notification
  // ─────────────────────────────────────────

  describe('autoCreateDevices setting', () => {
    it('leaves an unmatched host unlinked (no device created) when the setting is off', async () => {
      networkScanSettings.getConfig.mockResolvedValue({
        autoCreateDevices: false,
      });

      await service.ingestScanResults(
        [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
        null,
      );

      expect(devicesRepo.save).not.toHaveBeenCalled();
      expect(deviceTags.attach).not.toHaveBeenCalled();
      expect(allocationsRepo.update).not.toHaveBeenCalled();
      expect(notificationDispatcher.dispatchOpsAlert).not.toHaveBeenCalled();
    });

    it('does not even look up/create the auto-discovered tag when the setting is off', async () => {
      networkScanSettings.getConfig.mockResolvedValue({
        autoCreateDevices: false,
      });

      await service.ingestScanResults(
        [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
        null,
      );

      expect(deviceTags.listTags).not.toHaveBeenCalled();
      expect(deviceTags.createTag).not.toHaveBeenCalled();
    });

    it('still links a scan result to an already-known device even when the setting is off', async () => {
      networkScanSettings.getConfig.mockResolvedValue({
        autoCreateDevices: false,
      });
      qb.getOne.mockResolvedValue({ id: 'device-existing' });

      await service.ingestScanResults(
        [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
        null,
      );

      expect(allocationsRepo.update).toHaveBeenCalledWith(
        { ip: '10.0.0.5', source: IpAllocationSource.SCAN },
        { deviceId: 'device-existing' },
      );
    });
  });

  describe('device_auto_discovered notification', () => {
    it('fires one dispatchOpsAlert summarizing every device created in this call, not one per device', async () => {
      await service.ingestScanResults(
        [
          { ip: '10.0.0.5', mac: '00:1B:D4:11:22:33', hostname: 'sw-1' },
          { ip: '10.0.0.6', mac: '18:34:AF:11:22:33', hostname: 'pc-1' },
        ],
        null,
      );

      expect(notificationDispatcher.dispatchOpsAlert).toHaveBeenCalledTimes(1);
      const [call] = notificationDispatcher.dispatchOpsAlert.mock.calls[0];
      expect(call.event).toBe('device_auto_discovered');
      expect(call.body).toContain('sw-1');
      expect(call.body).toContain('pc-1');
    });

    it('does not fire a notification when nothing new was created', async () => {
      qb.getOne.mockResolvedValue({ id: 'device-existing' });

      await service.ingestScanResults(
        [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
        null,
      );

      expect(notificationDispatcher.dispatchOpsAlert).not.toHaveBeenCalled();
    });

    it('does not let a notification-dispatch failure throw out of ingestScanResults', async () => {
      notificationDispatcher.dispatchOpsAlert.mockRejectedValue(
        new Error('smtp down'),
      );

      await expect(
        service.ingestScanResults(
          [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
          null,
        ),
      ).resolves.not.toThrow();
    });
  });
});
