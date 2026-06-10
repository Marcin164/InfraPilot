import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RetentionService } from './retention.service';
import { RetentionPolicy } from 'src/entities/retentionPolicy.entity';
import { AuditService } from './audit.service';

const makePolicy = (overrides: Partial<RetentionPolicy> = {}): RetentionPolicy =>
  ({
    id: 'policy-1',
    entityType: 'Ticket',
    retentionDays: 365,
    action: 'purge',
    enabled: true,
    lastRunAt: null as any,
    lastRunAffected: null as any,
    ...overrides,
  } as RetentionPolicy);

describe('RetentionService', () => {
  let service: RetentionService;
  let repo: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (p: any) => ({ id: 'policy-1', ...p })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue([[], 0]),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionService,
        { provide: getRepositoryToken(RetentionPolicy), useValue: repo },
        { provide: DataSource, useValue: dataSource },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<RetentionService>(RetentionService);
  });

  // ─────────────────────────────────────────
  // supportedEntityTypes
  // ─────────────────────────────────────────

  describe('supportedEntityTypes', () => {
    it('returns the list of allowed entity types', () => {
      const types = service.supportedEntityTypes();
      expect(types).toContain('Ticket');
      expect(types).toContain('TicketComment');
    });
  });

  // ─────────────────────────────────────────
  // create
  // ─────────────────────────────────────────

  describe('create', () => {
    it('throws BadRequestException for unsupported entityType', async () => {
      await expect(service.create({ entityType: 'Unknown', retentionDays: 30 })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for forbidden entity SystemAuditLog', async () => {
      await expect(service.create({ entityType: 'SystemAuditLog', retentionDays: 30 })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when retentionDays < 1', async () => {
      await expect(service.create({ entityType: 'Ticket', retentionDays: 0 })).rejects.toThrow(BadRequestException);
    });

    it('creates and returns the policy', async () => {
      const result = await service.create({ entityType: 'Ticket', retentionDays: 365 });
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('policy-1');
    });

    it('logs audit after creation', async () => {
      await service.create({ entityType: 'Ticket', retentionDays: 365 });
      expect(audit.log).toHaveBeenCalledWith('RetentionPolicy', 'policy-1', 'created', expect.any(Object));
    });

    it('defaults action to purge and enabled to true', async () => {
      await service.create({ entityType: 'Ticket', retentionDays: 30 });
      const createdArg = repo.create.mock.calls[0][0];
      expect(createdArg.action).toBe('purge');
      expect(createdArg.enabled).toBe(true);
    });
  });

  // ─────────────────────────────────────────
  // update
  // ─────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when policy not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost', { retentionDays: 90 })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when patching with unsupported entityType', async () => {
      repo.findOneBy.mockResolvedValue(makePolicy());
      await expect(service.update('policy-1', { entityType: 'Unknown' })).rejects.toThrow(BadRequestException);
    });

    it('updates and saves the policy', async () => {
      const policy = makePolicy();
      repo.findOneBy.mockResolvedValue(policy);
      await service.update('policy-1', { retentionDays: 90 });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ retentionDays: 90 }));
    });
  });

  // ─────────────────────────────────────────
  // delete
  // ─────────────────────────────────────────

  describe('delete', () => {
    it('throws NotFoundException when policy not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('deletes and returns ok', async () => {
      repo.findOneBy.mockResolvedValue(makePolicy());
      const result = await service.delete('policy-1');
      expect(repo.delete).toHaveBeenCalledWith('policy-1');
      expect(result).toEqual({ ok: true });
    });
  });

  // ─────────────────────────────────────────
  // runPolicy
  // ─────────────────────────────────────────

  describe('runPolicy', () => {
    it('throws BadRequestException for unsupported entity type', async () => {
      await expect(service.runPolicy(makePolicy({ entityType: 'Unknown' }))).rejects.toThrow(BadRequestException);
    });

    it('executes DELETE query for purge action', async () => {
      dataSource.query.mockResolvedValue([null, 5]);
      await service.runPolicy(makePolicy({ action: 'purge' }));
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.any(Array),
      );
    });

    it('returns the number of affected rows', async () => {
      dataSource.query.mockResolvedValue([null, 7]);
      const count = await service.runPolicy(makePolicy({ action: 'purge' }));
      expect(count).toBe(7);
    });

    it('saves policy with updated lastRunAt and lastRunAffected', async () => {
      dataSource.query.mockResolvedValue([null, 3]);
      const policy = makePolicy();
      await service.runPolicy(policy);
      expect(policy.lastRunAt).toBeInstanceOf(Date);
      expect(policy.lastRunAffected).toBe(3);
    });

    it('archives rows and then deletes for archive action', async () => {
      const rows = [{ id: 'row-1', createdAt: new Date() }];
      dataSource.query
        .mockResolvedValueOnce(rows)   // SELECT
        .mockResolvedValueOnce([null, 1]); // DELETE

      const count = await service.runPolicy(makePolicy({ action: 'archive' as any }));
      expect(count).toBe(1);
      expect(audit.log).toHaveBeenCalledWith(
        'Ticket',
        'row-1',
        'archived',
        expect.any(Object),
      );
    });
  });

  // ─────────────────────────────────────────
  // runAll
  // ─────────────────────────────────────────

  describe('runAll', () => {
    it('returns empty runs when no enabled policies exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.runAll();
      expect(result.runs).toHaveLength(0);
    });

    it('runs each enabled policy and collects results', async () => {
      const p1 = makePolicy();
      const p2 = makePolicy({ id: 'policy-2', entityType: 'TicketComment' });
      repo.find.mockResolvedValue([p1, p2]);
      dataSource.query.mockResolvedValue([null, 2]);

      const result = await service.runAll();
      expect(result.runs).toHaveLength(2);
    });

    it('continues processing remaining policies when one fails', async () => {
      const p1 = makePolicy();
      const p2 = makePolicy({ id: 'policy-2', entityType: 'TicketComment' });
      repo.find.mockResolvedValue([p1, p2]);
      dataSource.query
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValue([null, 1]);

      const result = await service.runAll();
      expect(result.runs).toHaveLength(1); // only the successful one
    });
  });
});
