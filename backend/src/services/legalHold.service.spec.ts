import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LegalHoldService, CreateLegalHoldInput, ReleaseLegalHoldInput } from './legalHold.service';
import { LegalHold } from 'src/entities/legalHold.entity';
import { AuditService } from './audit.service';

const makeHold = (overrides: any = {}): any => ({
  id: 'hold-1',
  userId: 'user-1',
  reason: 'Litigation hold',
  legalBasis: 'GDPR Art. 17(3)',
  retainUntil: null,
  createdBy: 'admin-1',
  releasedAt: null,
  releasedBy: null,
  releasedReason: null,
  ...overrides,
});

const baseCreate = (): CreateLegalHoldInput => ({
  userId: 'user-1',
  reason: 'Litigation hold',
  legalBasis: 'GDPR Art. 17(3)',
  retainUntil: null,
  createdBy: 'admin-1',
});

describe('LegalHoldService', () => {
  let service: LegalHoldService;
  let repo: jest.Mocked<any>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (h: any) => ({ id: 'hold-1', ...h })),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalHoldService,
        { provide: getRepositoryToken(LegalHold), useValue: repo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<LegalHoldService>(LegalHoldService);
  });

  // ─────────────────────────────────────────
  // list
  // ─────────────────────────────────────────

  describe('list', () => {
    it('returns all holds', async () => {
      const holds = [makeHold()];
      repo.find.mockResolvedValue(holds);
      const result = await service.list();
      expect(result).toBe(holds);
    });

    it('filters by userId when provided', async () => {
      await service.list('user-1');
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });

    it('filters by activeOnly when requested', async () => {
      await service.list(undefined, true);
      const call = repo.find.mock.calls[0][0];
      expect(call.where.releasedAt).toBeDefined(); // IsNull()
    });
  });

  // ─────────────────────────────────────────
  // activeHolds / hasActiveHold
  // ─────────────────────────────────────────

  describe('activeHolds', () => {
    it('returns holds with no retainUntil and not released', async () => {
      repo.find.mockResolvedValue([makeHold({ retainUntil: null })]);
      const result = await service.activeHolds('user-1');
      expect(result).toHaveLength(1);
    });

    it('filters out holds whose retainUntil is in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      repo.find.mockResolvedValue([makeHold({ retainUntil: pastDate })]);
      const result = await service.activeHolds('user-1');
      expect(result).toHaveLength(0);
    });

    it('includes holds whose retainUntil is in the future', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      repo.find.mockResolvedValue([makeHold({ retainUntil: futureDate })]);
      const result = await service.activeHolds('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('hasActiveHold', () => {
    it('returns true when active holds exist', async () => {
      repo.find.mockResolvedValue([makeHold()]);
      expect(await service.hasActiveHold('user-1')).toBe(true);
    });

    it('returns false when no active holds exist', async () => {
      repo.find.mockResolvedValue([]);
      expect(await service.hasActiveHold('user-1')).toBe(false);
    });
  });

  // ─────────────────────────────────────────
  // create
  // ─────────────────────────────────────────

  describe('create', () => {
    it('throws BadRequestException when reason is empty', async () => {
      await expect(service.create({ ...baseCreate(), reason: '  ' })).rejects.toThrow(BadRequestException);
    });

    it('saves and returns the new legal hold', async () => {
      const result = await service.create(baseCreate());
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('hold-1');
    });

    it('logs audit event after creation', async () => {
      await service.create(baseCreate());
      expect(audit.log).toHaveBeenCalledWith(
        'LegalHold',
        'hold-1',
        'created',
        expect.any(Object),
      );
    });

    it('parses retainUntil string to a Date', async () => {
      await service.create({ ...baseCreate(), retainUntil: '2025-01-01' });
      const createdArg = repo.create.mock.calls[0][0];
      expect(createdArg.retainUntil).toBeInstanceOf(Date);
    });

    it('sets retainUntil to null when not provided', async () => {
      await service.create({ ...baseCreate(), retainUntil: null });
      const createdArg = repo.create.mock.calls[0][0];
      expect(createdArg.retainUntil).toBeNull();
    });
  });

  // ─────────────────────────────────────────
  // release
  // ─────────────────────────────────────────

  describe('release', () => {
    const baseRelease = (): ReleaseLegalHoldInput => ({
      id: 'hold-1',
      releasedBy: 'admin-1',
      releasedReason: 'Case settled',
    });

    it('throws NotFoundException when hold is not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.release(baseRelease())).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when hold is already released', async () => {
      repo.findOneBy.mockResolvedValue(makeHold({ releasedAt: new Date() }));
      await expect(service.release(baseRelease())).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when releasedReason is empty', async () => {
      repo.findOneBy.mockResolvedValue(makeHold());
      await expect(service.release({ ...baseRelease(), releasedReason: '  ' })).rejects.toThrow(BadRequestException);
    });

    it('saves released hold with releasedAt set', async () => {
      const hold = makeHold();
      repo.findOneBy.mockResolvedValue(hold);

      await service.release(baseRelease());

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          releasedBy: 'admin-1',
          releasedReason: 'Case settled',
        }),
      );
      expect(hold.releasedAt).toBeInstanceOf(Date);
    });

    it('logs audit event after release', async () => {
      repo.findOneBy.mockResolvedValue(makeHold());
      await service.release(baseRelease());
      expect(audit.log).toHaveBeenCalledWith(
        'LegalHold',
        'hold-1',
        'released',
        expect.any(Object),
      );
    });
  });
});
