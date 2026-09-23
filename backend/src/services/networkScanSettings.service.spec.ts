import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NetworkScanSettingsService } from './networkScanSettings.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';

describe('NetworkScanSettingsService', () => {
  let service: NetworkScanSettingsService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (r: any) => r),
      insert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkScanSettingsService,
        { provide: getRepositoryToken(AdminSettings), useValue: repo },
      ],
    }).compile();

    service = module.get<NetworkScanSettingsService>(
      NetworkScanSettingsService,
    );
  });

  describe('getConfig', () => {
    it('defaults to autoCreateDevices: true when no row exists yet', async () => {
      const config = await service.getConfig();
      expect(config).toEqual({ autoCreateDevices: true });
    });

    it('reads back a previously saved value', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'network_scan_config',
        value: { autoCreateDevices: false },
      });
      const config = await service.getConfig();
      expect(config).toEqual({ autoCreateDevices: false });
    });
  });

  describe('saveConfig', () => {
    it('inserts a new row when none exists', async () => {
      const result = await service.saveConfig({ autoCreateDevices: false });

      expect(repo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'network_scan_config',
          value: { autoCreateDevices: false },
        }),
      );
      expect(result).toEqual({ autoCreateDevices: false });
    });

    it('updates the existing row instead of inserting a duplicate', async () => {
      const existing = {
        id: 'row-1',
        key: 'network_scan_config',
        value: { autoCreateDevices: true },
      };
      repo.findOne.mockResolvedValue(existing);

      await service.saveConfig({ autoCreateDevices: false });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ value: { autoCreateDevices: false } }),
      );
      expect(repo.insert).not.toHaveBeenCalled();
    });

    it('leaves the current value untouched for fields not passed in', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        key: 'network_scan_config',
        value: { autoCreateDevices: false },
      });

      const result = await service.saveConfig({});
      expect(result).toEqual({ autoCreateDevices: false });
    });
  });
});
