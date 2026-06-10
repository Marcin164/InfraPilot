import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DeviceReportService } from './deviceReport.service';
import { Devices } from 'src/entities/devices.entity';
import { SoftwareInventoryService } from './softwareInventory.service';
import { ComplianceService } from './compliance.service';
import { CveService } from './cve.service';

describe('DeviceReportService', () => {
  let service: DeviceReportService;
  let devicesRepo: jest.Mocked<any>;
  let softwareInventory: jest.Mocked<any>;
  let compliance: jest.Mocked<any>;
  let cve: jest.Mocked<any>;

  const makeDevice = (overrides: any = {}) => ({
    id: 'dev-1',
    assetName: 'PC-001',
    serialNumber: 'SN123',
    manufacturer: 'Dell',
    model: 'Latitude 5520',
    location: 'Warsaw',
    lifecycle: 'active',
    lifecycleNote: null,
    lastScanAt: new Date('2024-01-01'),
    createdAt: new Date('2023-01-01'),
    system: null,
    hardware: null,
    security: null,
    network: null,
    user: null,
    vendor: null,
    purchaseOrder: null,
    purchaseDate: null,
    purchasePrice: null,
    purchaseCurrency: null,
    warrantyStart: null,
    warrantyEnd: null,
    retiredAt: null,
    disposedAt: null,
    disposalMethod: null,
    ...overrides,
  });

  beforeEach(async () => {
    devicesRepo = { findOne: jest.fn().mockResolvedValue(null) };
    softwareInventory = { forDevice: jest.fn().mockResolvedValue([]) };
    compliance = { resultsForDevice: jest.fn().mockResolvedValue([]) };
    cve = { forDevice: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceReportService,
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
        { provide: SoftwareInventoryService, useValue: softwareInventory },
        { provide: ComplianceService, useValue: compliance },
        { provide: CveService, useValue: cve },
      ],
    }).compile();

    service = module.get<DeviceReportService>(DeviceReportService);
  });

  describe('render', () => {
    it('throws NotFoundException when device not found', async () => {
      await expect(service.render('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns buffer, sha256, and filename for existing device', async () => {
      devicesRepo.findOne.mockResolvedValue(makeDevice());
      const result = await service.render('dev-1');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(typeof result.sha256).toBe('string');
      expect(result.sha256.length).toBe(64); // SHA256 hex
      expect(result.filename).toMatch(/^device-dev-1-\d+\.pdf$/);
    }, 15000);

    it('queries software, compliance, and CVE data', async () => {
      devicesRepo.findOne.mockResolvedValue(makeDevice());
      await service.render('dev-1');
      expect(softwareInventory.forDevice).toHaveBeenCalledWith('dev-1', false);
      expect(compliance.resultsForDevice).toHaveBeenCalledWith('dev-1');
      expect(cve.forDevice).toHaveBeenCalledWith('dev-1');
    }, 15000);
  });
});
