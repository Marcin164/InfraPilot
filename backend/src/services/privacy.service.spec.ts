import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { Users } from 'src/entities/users.entity';
import { AuditService } from './audit.service';
import { LegalHoldService } from './legalHold.service';

const makeUser = (overrides: any = {}): any => ({
  id: 'user-1',
  name: 'Jan',
  surname: 'Kowalski',
  email: 'jan@example.com',
  username: 'jkowalski',
  phone: null,
  title: null,
  department: null,
  company: null,
  office: null,
  streetAddress: null,
  city: null,
  postalCode: null,
  country: null,
  manager: null,
  distinguishedName: null,
  authUserId: 'auth-1',
  memberOf: null,
  userAccountControl: null,
  pwdLastSet: null,
  whenCreated: null,
  erasedAt: null,
  erasureReason: null,
  ...overrides,
});

describe('PrivacyService', () => {
  let service: PrivacyService;
  let usersRepo: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;
  let audit: jest.Mocked<any>;
  let legalHolds: jest.Mocked<any>;

  beforeEach(async () => {
    usersRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue([]),
    };
    audit = {
      log: jest.fn().mockResolvedValue(undefined),
      exportRange: jest.fn().mockResolvedValue([]),
    };
    legalHolds = {
      list: jest.fn().mockResolvedValue([]),
      activeHolds: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: AuditService, useValue: audit },
        { provide: LegalHoldService, useValue: legalHolds },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
  });

  describe('getPersonalData', () => {
    it('throws NotFoundException when user not found', async () => {
      await expect(service.getPersonalData('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns PII fields when user exists', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser());
      const result = await service.getPersonalData('user-1');
      expect(result.email).toBe('jan@example.com');
      expect(result.name).toBe('Jan');
    });
  });

  describe('exportAllData', () => {
    it('throws NotFoundException when user not found', async () => {
      await expect(service.exportAllData('ghost', 'actor')).rejects.toThrow(NotFoundException);
    });

    it('returns stream, filename, and requestId for existing user', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser());
      const result = await service.exportAllData('user-1', 'actor-1');
      expect(result.requestId).toBeDefined();
      expect(result.filename).toContain('dsar-user-1-');
      expect(result.stream).toBeDefined();
    });

    it('logs export_generated audit event', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser());
      await service.exportAllData('user-1', 'actor-1');
      expect(audit.log).toHaveBeenCalledWith(
        'PrivacyRecord',
        'user-1',
        'export_generated',
        expect.any(Object),
      );
    });
  });

  describe('eraseUser', () => {
    it('throws NotFoundException when user not found', async () => {
      await expect(service.eraseUser('ghost', { actor: 'a', reason: 'r' })).rejects.toThrow(NotFoundException);
    });

    it('returns noop result when user is already erased', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser({ erasedAt: new Date() }));
      const result = await service.eraseUser('user-1', { actor: 'a', reason: 'r' });
      expect(result.status).toBe('completed');
      expect(result.fieldsNulled).toHaveLength(0);
    });

    it('throws ConflictException when active legal holds exist', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser());
      legalHolds.activeHolds.mockResolvedValue([{ id: 'hold-1', reason: 'Litigation', legalBasis: 'GDPR 17(3)', retainUntil: null }]);
      await expect(service.eraseUser('user-1', { actor: 'a', reason: 'r' })).rejects.toThrow(ConflictException);
    });

    it('nullifies PII fields and returns fieldsNulled list', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser());
      legalHolds.activeHolds.mockResolvedValue([]);
      const result = await service.eraseUser('user-1', { actor: 'a', reason: 'GDPR request' });
      expect(result.status).toBe('completed');
      expect(result.fieldsNulled).toContain('name');
      expect(result.fieldsNulled).toContain('email');
      expect(usersRepo.update).toHaveBeenCalled();
    });

    it('logs erased audit event after successful erasure', async () => {
      usersRepo.findOneBy.mockResolvedValue(makeUser());
      legalHolds.activeHolds.mockResolvedValue([]);
      await service.eraseUser('user-1', { actor: 'a', reason: 'test' });
      expect(audit.log).toHaveBeenCalledWith(
        'PrivacyRecord',
        'user-1',
        'erased',
        expect.any(Object),
      );
    });
  });
});
