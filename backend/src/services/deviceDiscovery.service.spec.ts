import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DeviceDiscoveryService } from './deviceDiscovery.service';
import { DeviceTagsService } from './deviceTags.service';
import { Devices } from 'src/entities/devices.entity';
import { IpAllocation, IpAllocationSource } from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';

describe('DeviceDiscoveryService', () => {
  let service: DeviceDiscoveryService;
  let devicesRepo: jest.Mocked<any>;
  let allocationsRepo: jest.Mocked<any>;
  let subnetsRepo: jest.Mocked<any>;
  let deviceTags: jest.Mocked<any>;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceDiscoveryService,
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        { provide: getRepositoryToken(IpAllocation), useValue: allocationsRepo },
        { provide: getRepositoryToken(Subnet), useValue: subnetsRepo },
        { provide: DeviceTagsService, useValue: deviceTags },
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
  });

  it('creates a new device, classifies it, tags it, and links the allocation when no match exists', async () => {
    devicesRepo.save.mockImplementation(async (d: any) => d);

    await service.ingestScanResults(
      [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33', hostname: 'sw-1', openPorts: [22], respondedToPing: true }],
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
    subnetsRepo.findOneBy.mockResolvedValue({ id: 'subnet-1', locationId: 'loc-1' });

    await service.ingestScanResults(
      [{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }],
      'subnet-1',
    );

    expect(devicesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ locationId: 'loc-1' }),
    );
  });

  it('reuses the auto-discovered tag on a second ingest instead of recreating it', async () => {
    deviceTags.listTags.mockResolvedValue([{ id: 'tag-existing', key: 'auto-discovered' }]);

    await service.ingestScanResults([{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }], null);

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
      .mockResolvedValueOnce([{ id: 'tag-from-other-request', key: 'auto-discovered' }]); // retry after conflict
    deviceTags.createTag.mockRejectedValue(new BadRequestException('Tag key already exists'));

    await service.ingestScanResults([{ ip: '10.0.0.5', mac: '00:1B:D4:11:22:33' }], null);

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
});
