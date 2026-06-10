import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { RemoteAssistService } from './remoteAssist.service';
import { Devices } from 'src/entities/devices.entity';
import { AuditService } from './audit.service';

describe('RemoteAssistService', () => {
  let service: RemoteAssistService;
  let devices: jest.Mocked<any>;
  let audit: jest.Mocked<any>;

  const ORIGINAL_ENV = process.env;

  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    devices = { findOneBy: jest.fn().mockResolvedValue(null) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoteAssistService,
        { provide: getRepositoryToken(Devices), useValue: devices },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<RemoteAssistService>(RemoteAssistService);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('isConfigured', () => {
    it('returns false when env vars are missing', () => {
      delete process.env.REMOTE_ASSIST_BASE_URL;
      delete process.env.REMOTE_ASSIST_TOKEN_SECRET;
      expect(service.isConfigured()).toBe(false);
    });

    it('returns true when both env vars are set', () => {
      process.env.REMOTE_ASSIST_BASE_URL = 'https://remote.example.com';
      process.env.REMOTE_ASSIST_TOKEN_SECRET = 'secret';
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('startSession', () => {
    it('throws ServiceUnavailableException when not configured', async () => {
      delete process.env.REMOTE_ASSIST_BASE_URL;
      delete process.env.REMOTE_ASSIST_TOKEN_SECRET;
      await expect(service.startSession({ deviceId: 'dev-1', actorId: 'actor-1' }))
        .rejects.toThrow(ServiceUnavailableException);
    });

    it('throws NotFoundException when device not found', async () => {
      process.env.REMOTE_ASSIST_BASE_URL = 'https://remote.example.com';
      process.env.REMOTE_ASSIST_TOKEN_SECRET = 'secret';
      devices.findOneBy.mockResolvedValue(null);
      await expect(service.startSession({ deviceId: 'ghost', actorId: 'actor-1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('returns url, expiresAt, and ttlSeconds on success', async () => {
      process.env.REMOTE_ASSIST_BASE_URL = 'https://remote.example.com';
      process.env.REMOTE_ASSIST_TOKEN_SECRET = 'secret';
      devices.findOneBy.mockResolvedValue({ id: 'dev-1', assetName: 'PC-001' });
      const result = await service.startSession({ deviceId: 'dev-1', actorId: 'actor-1' });
      expect(result.url).toContain('https://remote.example.com');
      expect(result.url).toContain('sig=');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.ttlSeconds).toBe(300); // 5 min
    });

    it('includes ticketId in URL when provided', async () => {
      process.env.REMOTE_ASSIST_BASE_URL = 'https://remote.example.com';
      process.env.REMOTE_ASSIST_TOKEN_SECRET = 'secret';
      devices.findOneBy.mockResolvedValue({ id: 'dev-1', assetName: 'PC-001' });
      const result = await service.startSession({ deviceId: 'dev-1', actorId: 'actor-1', ticketId: 'tkt-1' });
      expect(result.url).toContain('ticketId=tkt-1');
    });

    it('logs an audit event on success', async () => {
      process.env.REMOTE_ASSIST_BASE_URL = 'https://remote.example.com';
      process.env.REMOTE_ASSIST_TOKEN_SECRET = 'secret';
      devices.findOneBy.mockResolvedValue({ id: 'dev-1', assetName: 'PC-001' });
      await service.startSession({ deviceId: 'dev-1', actorId: 'actor-1' });
      expect(audit.log).toHaveBeenCalledWith('Device', 'dev-1', 'remote_session_started', expect.any(Object));
    });
  });
});
