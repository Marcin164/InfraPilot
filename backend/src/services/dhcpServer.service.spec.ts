import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DhcpServerService } from './dhcpServer.service';
import { DhcpDriverType, DhcpServer } from 'src/entities/dhcpServer.entity';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { Devices } from 'src/entities/devices.entity';

describe('DhcpServerService', () => {
  let service: DhcpServerService;
  let sourcesRepo: jest.Mocked<any>;
  let credentialsRepo: jest.Mocked<any>;
  let devicesRepo: jest.Mocked<any>;

  beforeEach(async () => {
    sourcesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((v: any) => v),
      save: jest.fn().mockImplementation((s: any) => Promise.resolve(s)),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    credentialsRepo = { findOneBy: jest.fn().mockResolvedValue({ deviceId: 'dev-1' }) };
    devicesRepo = { findOneBy: jest.fn().mockResolvedValue({ id: 'dev-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DhcpServerService,
        { provide: getRepositoryToken(DhcpServer), useValue: sourcesRepo },
        { provide: getRepositoryToken(NetworkDeviceCredential), useValue: credentialsRepo },
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
      ],
    }).compile();

    service = module.get(DhcpServerService);
  });

  describe('create', () => {
    const VALID_DTO = {
      name: 'Core MikroTik',
      driverType: DhcpDriverType.SSH_SCRAPE,
      deviceId: 'dev-1',
      config: { command: '/ip dhcp-server lease print', lineTemplate: '{ip} {mac}' },
    };

    it('creates an ssh_scrape source when the device has an SSH credential', async () => {
      const result = await service.create(VALID_DTO);
      expect(result).toEqual(expect.objectContaining({ name: 'Core MikroTik', driverType: DhcpDriverType.SSH_SCRAPE, enabled: false }));
    });

    it('rejects ssh_scrape without a deviceId', async () => {
      await expect(service.create({ ...VALID_DTO, deviceId: undefined })).rejects.toThrow('ssh_scrape requires deviceId');
    });

    it('rejects ssh_scrape without command/lineTemplate in config', async () => {
      await expect(service.create({ ...VALID_DTO, config: { command: 'foo' } })).rejects.toThrow('requires config.command and config.lineTemplate');
    });

    it('rejects when the device does not exist', async () => {
      devicesRepo.findOneBy.mockResolvedValue(null);
      await expect(service.create(VALID_DTO)).rejects.toThrow('Device not found');
    });

    it('rejects when the device has no SSH credential configured yet', async () => {
      credentialsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.create(VALID_DTO)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('re-validates config using the merged driverType/deviceId/config', async () => {
      sourcesRepo.findOne.mockResolvedValue({
        id: 'src-1',
        name: 'Old name',
        driverType: DhcpDriverType.SSH_SCRAPE,
        deviceId: 'dev-1',
        config: { command: 'x', lineTemplate: 'y' },
        enabled: false,
      });

      const result = await service.update('src-1', { name: 'New name' });
      expect(result.name).toBe('New name');
    });

    it('throws NotFoundException for a missing source', async () => {
      sourcesRepo.findOne.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException for a missing source', async () => {
      sourcesRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
