import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DevicesService } from './devices.service';
import { Devices } from 'src/entities/devices.entity';
import { SoftwareInventoryService } from './softwareInventory.service';
import { ComplianceService } from './compliance.service';
import { DeviceScanService } from './deviceScan.service';
import { DeviceIdentityService } from './deviceIdentity.service';

jest.mock('src/guards/agentGuard.guard', () => ({
  hashAgentSecret: jest.fn((s: string) => `hashed:${s}`),
}));

jest.mock('src/helpers/uuidv4', () => ({
  uuidv4: jest.fn(() => 'generated-uuid'),
}));

const mockDevice = (overrides: Partial<Devices> = {}): Devices =>
  ({
    id: 'device-uuid',
    group: 'Computers',
    subgroup: 'Laptops',
    userId: null,
    state: 'active',
    isOn: false,
    serialNumber: 'SN-001',
    assetName: 'PC-001',
    manufacturer: 'Dell',
    model: 'Latitude 5520',
    apiSecretHash: null,
    apiSecretHashPrev: null,
    apiSecretPrevValidUntil: null,
    apiSecretRotatedAt: null,
    tpmFingerprint: null,
    macAddresses: null,
    cpuId: null,
    mergedIntoId: null,
    ...overrides,
  } as Devices);

describe('DevicesService', () => {
  let service: DevicesService;
  let devicesRepo: jest.Mocked<any>;
  let softwareInventory: jest.Mocked<SoftwareInventoryService>;
  let compliance: jest.Mocked<ComplianceService>;
  let scanHistory: jest.Mocked<DeviceScanService>;
  let identity: jest.Mocked<DeviceIdentityService>;

  beforeEach(async () => {
    const qb: any = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    devicesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((dto: any) => dto),
      save: jest.fn(async (d: any) => d),
      update: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };

    softwareInventory = { processScanData: jest.fn() } as any;
    compliance = { runForDevice: jest.fn() } as any;
    scanHistory = { record: jest.fn() } as any;
    identity = { findMergeCandidates: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        { provide: SoftwareInventoryService, useValue: softwareInventory },
        { provide: ComplianceService, useValue: compliance },
        { provide: DeviceScanService, useValue: scanHistory },
        { provide: DeviceIdentityService, useValue: identity },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
  });

  // ─────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns all devices from the repository', async () => {
      const devices = [mockDevice(), mockDevice({ id: 'device-2', serialNumber: 'SN-002' })];
      devicesRepo.find.mockResolvedValue(devices);

      const result = await service.findAll();

      expect(devicesRepo.find).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result).toEqual(devices);
    });

    it('returns empty array when no devices exist', async () => {
      devicesRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────
  // findDevice
  // ─────────────────────────────────────────

  describe('findDevice', () => {
    it('finds a device by id', async () => {
      const device = mockDevice();
      devicesRepo.findOneBy.mockResolvedValue(device);

      const result = await service.findDevice('device-uuid');

      expect(devicesRepo.findOneBy).toHaveBeenCalledWith({ id: 'device-uuid' });
      expect(result).toEqual(device);
    });

    it('returns null when device does not exist', async () => {
      devicesRepo.findOneBy.mockResolvedValue(null);

      const result = await service.findDevice('non-existent');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────
  // addDevice
  // ─────────────────────────────────────────

  describe('addDevice', () => {
    it('creates and saves a device with the provided fields', async () => {
      const dto = {
        group: 'Computers',
        subgroup: 'Servers',
        userId: 'user-1',
        serialNumber: 'SRV-001',
        assetName: 'SERVER-01',
        model: 'PowerEdge R750',
        manufacturer: 'Dell',
        location: 'DC-East',
      };
      const saved = { ...dto, id: 'generated-uuid', state: 'active', isOn: false };
      devicesRepo.save.mockResolvedValue(saved);

      const result = await service.addDevice(dto);

      expect(devicesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          group: 'Computers',
          serialNumber: 'SRV-001',
          state: 'active',
          isOn: false,
        }),
      );
      expect(devicesRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(saved);
    });
  });

  // ─────────────────────────────────────────
  // assignDeviceToUser
  // ─────────────────────────────────────────

  describe('assignDeviceToUser', () => {
    it('assigns a user to an existing device', async () => {
      const device = mockDevice({ userId: null });
      devicesRepo.findOne.mockResolvedValue(device);
      devicesRepo.save.mockResolvedValue({ ...device, userId: 'user-99' });

      const result = await service.assignDeviceToUser('device-uuid', 'user-99');

      expect(result.userId).toBe('user-99');
      expect(devicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-99' }),
      );
    });

    it('throws an error when device does not exist', async () => {
      devicesRepo.findOne.mockResolvedValue(null);

      await expect(service.assignDeviceToUser('non-existent', 'user-1')).rejects.toThrow(
        'Device with ID non-existent not found',
      );
    });
  });

  // ─────────────────────────────────────────
  // rotateAgentSecret
  // ─────────────────────────────────────────

  describe('rotateAgentSecret', () => {
    it('throws NotFoundException when device does not exist', async () => {
      devicesRepo.findOneBy.mockResolvedValue(null);

      await expect(service.rotateAgentSecret('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rotates the secret and preserves previous hash for grace period', async () => {
      const device = mockDevice({ apiSecretHash: 'old-hash', apiSecretHashPrev: null });
      devicesRepo.findOneBy.mockResolvedValue(device);
      devicesRepo.save.mockImplementation(async (d: any) => d);

      const result = await service.rotateAgentSecret('device-uuid');

      expect(typeof result.secret).toBe('string');
      expect(result.secret).toHaveLength(64);

      expect(devicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          apiSecretHashPrev: 'old-hash',
          apiSecretPrevValidUntil: expect.any(Date),
        }),
      );
    });

    it('does not set apiSecretPrevValidUntil when there was no previous hash', async () => {
      const device = mockDevice({ apiSecretHash: null });
      devicesRepo.findOneBy.mockResolvedValue(device);
      devicesRepo.save.mockImplementation(async (d: any) => d);

      await service.rotateAgentSecret('device-uuid');

      expect(devicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ apiSecretPrevValidUntil: null }),
      );
    });
  });

  // ─────────────────────────────────────────
  // revokeAgentSecret
  // ─────────────────────────────────────────

  describe('revokeAgentSecret', () => {
    it('throws NotFoundException when device does not exist', async () => {
      devicesRepo.findOneBy.mockResolvedValue(null);

      await expect(service.revokeAgentSecret('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('clears all secret fields on the device', async () => {
      const device = mockDevice({ apiSecretHash: 'hash', apiSecretHashPrev: 'old', apiSecretPrevValidUntil: new Date() });
      devicesRepo.findOneBy.mockResolvedValue(device);
      devicesRepo.save.mockImplementation(async (d: any) => d);

      await service.revokeAgentSecret('device-uuid');

      expect(devicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          apiSecretHash: null,
          apiSecretHashPrev: null,
          apiSecretPrevValidUntil: null,
        }),
      );
    });
  });

  // ─────────────────────────────────────────
  // enrollAgent
  // ─────────────────────────────────────────

  describe('enrollAgent', () => {
    beforeEach(() => {
      devicesRepo.findOneBy.mockResolvedValue(mockDevice({ apiSecretHash: null }));
      devicesRepo.save.mockImplementation(async (d: any) => d);
    });

    it('matches an existing device by TPM fingerprint (score 100)', async () => {
      const existing = mockDevice({ tpmFingerprint: 'tpm-abc', mergedIntoId: null });
      devicesRepo.find.mockResolvedValue([existing]);
      devicesRepo.findOneBy.mockResolvedValue(existing);

      const result = await service.enrollAgent({ tpmFingerprint: 'tpm-abc' });

      expect(result.matched).toBe(true);
      expect(result.matchReasons).toContain('TPM');
      expect(result.deviceId).toBe(existing.id);
    });

    it('auto-creates a new device when no match meets the threshold', async () => {
      devicesRepo.find.mockResolvedValue([]);
      const created = { ...mockDevice(), id: 'generated-uuid' };
      devicesRepo.findOneBy.mockResolvedValue(created);

      const result = await service.enrollAgent({ hostname: 'NEW-PC' });

      expect(result.matched).toBe(false);
      expect(devicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ group: 'Computers', subgroup: undefined }),
      );
    });

    it('uses the agent-reported deviceType as subgroup when it is a real option', async () => {
      devicesRepo.find.mockResolvedValue([]);
      devicesRepo.findOneBy.mockResolvedValue({ ...mockDevice(), id: 'generated-uuid' });

      await service.enrollAgent({ hostname: 'NEW-LAPTOP', deviceType: 'Laptop' });

      expect(devicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ group: 'Computers', subgroup: 'Laptop' }),
      );
    });

    it('ignores an unrecognized deviceType rather than saving a bogus subgroup', async () => {
      devicesRepo.find.mockResolvedValue([]);
      devicesRepo.findOneBy.mockResolvedValue({ ...mockDevice(), id: 'generated-uuid' });

      await service.enrollAgent({ hostname: 'NEW-PC', deviceType: 'Tablet' });

      expect(devicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ group: 'Computers', subgroup: undefined }),
      );
    });

    it('matches by CPU id when score equals the threshold (50)', async () => {
      const existing = mockDevice({ cpuId: 'CPU-XYZ-001', tpmFingerprint: null, macAddresses: null, mergedIntoId: null });
      devicesRepo.find.mockResolvedValue([existing]);
      devicesRepo.findOneBy.mockResolvedValue(existing);

      const result = await service.enrollAgent({ cpuId: 'CPU-XYZ-001' });

      expect(result.matched).toBe(true);
      expect(result.matchReasons).toContain('CPU id');
    });

    it('returns plaintext secret exactly once', async () => {
      devicesRepo.find.mockResolvedValue([]);
      const created = mockDevice();
      devicesRepo.findOneBy.mockResolvedValue(created);

      const { secret } = await service.enrollAgent({});

      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });
  });
});
