import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActiveDirectoryService } from './active-directory.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';

jest.mock('activedirectory2');
jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => {
    if (!v.startsWith('gcm:enc:')) throw new Error('bad key');
    return v.replace('gcm:enc:', '');
  }),
}));

import { decrypt as decryptMock } from 'src/helpers/crypto';
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn().mockReturnValue(false),
    mkdirSync: jest.fn(),
    copyFileSync: jest.fn(),
    readFileSync: jest.fn().mockReturnValue(Buffer.from('cert')),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
  };
});

import * as fs from 'fs';
const fsMock = fs as jest.Mocked<typeof fs>;

describe('ActiveDirectoryService', () => {
  let service: ActiveDirectoryService;
  let configService: jest.Mocked<any>;
  let settingsRepo: jest.Mocked<any>;

  beforeEach(async () => {
    (fsMock.existsSync as jest.Mock).mockReturnValue(false);
    (fsMock.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (fsMock.unlinkSync as jest.Mock).mockImplementation(() => undefined);

    configService = {
      get: jest.fn().mockReturnValue(null),
    };
    settingsRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActiveDirectoryService,
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(AdminSettings), useValue: settingsRepo },
      ],
    }).compile();

    service = module.get<ActiveDirectoryService>(ActiveDirectoryService);
  });

  describe('onModuleInit', () => {
    it('initialises without errors when no config is available', async () => {
      settingsRepo.findOne.mockResolvedValue(null);
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('getStatus', () => {
    it('returns disconnected status when no config saved', async () => {
      settingsRepo.findOne.mockResolvedValue(null);
      const status = await service.getStatus();
      expect(status.connected).toBe(false);
      expect(status.url).toBeNull();
    });

    it('returns last sync info when available', async () => {
      settingsRepo.findOne
        .mockResolvedValueOnce(null) // ad_config
        .mockResolvedValueOnce({ value: { lastSync: '2024-01-01', lastSyncUsersCount: 50 } }); // sync info
      const status = await service.getStatus();
      expect(status.lastSync).toBe('2024-01-01');
      expect(status.lastSyncUsersCount).toBe(50);
    });
  });

  describe('disconnect', () => {
    it('returns error when password is wrong', async () => {
      settingsRepo.findOne.mockResolvedValue({ value: { url: 'ldap://example.com', baseDN: 'DC=example,DC=com', username: 'admin', password: 'gcm:enc:correct' } });
      const result = await service.disconnect('wrong');
      expect(result.success).toBe(false);
    });

    it('disconnects successfully with correct password', async () => {
      settingsRepo.findOne.mockResolvedValue({ value: { url: 'ldap://example.com', baseDN: 'DC=example,DC=com', username: 'admin', password: 'gcm:enc:correct' } });
      const result = await service.disconnect('correct');
      expect(result.success).toBe(true);
    });

    it('falls back to env AD_PASSWORD instead of using undecryptable ciphertext as the password', async () => {
      // Simulates ENCRYPTION_KEY having changed since this row was saved —
      // the stored value still looks encrypted (gcm: prefix) but decrypt()
      // fails. Regression test for the bug where the raw ciphertext blob
      // was silently used as the password, permanently locking admins out.
      settingsRepo.findOne.mockResolvedValue({
        value: { url: 'ldap://example.com', baseDN: 'DC=example,DC=com', username: 'admin', password: 'gcm:some-blob-from-a-different-key' },
      });
      (decryptMock as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unsupported state or unable to authenticate data');
      });
      configService.get.mockImplementation((key: string) =>
        key === 'ad.password' ? 'env-password' : null,
      );

      const wrongResult = await service.disconnect('gcm:some-blob-from-a-different-key');
      expect(wrongResult.success).toBe(false);

      settingsRepo.findOne.mockResolvedValue({
        value: { url: 'ldap://example.com', baseDN: 'DC=example,DC=com', username: 'admin', password: 'gcm:some-blob-from-a-different-key' },
      });
      (decryptMock as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unsupported state or unable to authenticate data');
      });

      const rightResult = await service.disconnect('env-password');
      expect(rightResult.success).toBe(true);
    });
  });

  describe('uploadCertificate', () => {
    it('writes certificate to disk', async () => {
      const result = await service.uploadCertificate(Buffer.from('cert-data'));
      expect(fsMock.writeFileSync).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('deleteCertificate', () => {
    it('returns success when cert does not exist', async () => {
      (fsMock.existsSync as jest.Mock).mockReturnValue(false);
      const result = await service.deleteCertificate();
      expect(result.success).toBe(true);
    });

    it('deletes cert file when it exists', async () => {
      (fsMock.existsSync as jest.Mock).mockReturnValue(true);
      await service.deleteCertificate();
      expect(fsMock.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('saveSyncInfo', () => {
    it('inserts new sync info when none exists', async () => {
      settingsRepo.findOne.mockResolvedValue(null);
      await service.saveSyncInfo(123);
      expect(settingsRepo.insert).toHaveBeenCalled();
    });

    it('updates existing sync info', async () => {
      const existing = { key: 'ad_sync_info', value: {} };
      settingsRepo.findOne.mockResolvedValue(existing);
      await service.saveSyncInfo(200);
      expect(settingsRepo.save).toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    it('throws when AD is not connected', async () => {
      await expect(service.authenticate('user', 'pass')).rejects.toThrow('Active Directory');
    });
  });

  describe('findAllUsers', () => {
    it('throws when AD is not connected', async () => {
      await expect(service.findAllUsers()).rejects.toThrow('Active Directory');
    });
  });
});
