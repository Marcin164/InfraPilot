import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { AuditService, canonicalJson, computeHash } from './audit.service';
import { SystemAuditLog } from 'src/entities/systemAuditLog.entity';
import { AuditSinksService } from './auditSinks/orchestrator.service';

const buildQb = (overrides: Record<string, any> = {}) => {
  const qb: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
  return qb;
};

describe('canonicalJson', () => {
  it('serialises null/undefined as "null"', () => {
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson(undefined)).toBe('null');
  });

  it('serialises primitives correctly', () => {
    expect(canonicalJson(42)).toBe('42');
    expect(canonicalJson('hello')).toBe('"hello"');
    expect(canonicalJson(true)).toBe('true');
  });

  it('sorts object keys deterministically', () => {
    const a = canonicalJson({ z: 1, a: 2, m: 3 });
    const b = canonicalJson({ m: 3, z: 1, a: 2 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":2,"m":3,"z":1}');
  });

  it('handles nested objects deterministically', () => {
    const obj = { b: { y: 1, x: 2 }, a: 'val' };
    expect(canonicalJson(obj)).toBe('{"a":"val","b":{"x":2,"y":1}}');
  });

  it('handles arrays preserving element order', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
    expect(canonicalJson([{ b: 1, a: 2 }])).toBe('[{"a":2,"b":1}]');
  });
});

describe('computeHash', () => {
  const baseRow = {
    entityType: 'Ticket',
    entityId: 'e1',
    action: 'created',
    metadata: { foo: 'bar' },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    prevHash: null,
    sequence: '1',
  };

  it('produces a 64-character hex SHA-256 digest', () => {
    const hash = computeHash(baseRow);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(computeHash(baseRow)).toBe(computeHash(baseRow));
  });

  it('changes when any field changes', () => {
    const h1 = computeHash(baseRow);
    const h2 = computeHash({ ...baseRow, action: 'updated' });
    const h3 = computeHash({ ...baseRow, sequence: '2' });
    const h4 = computeHash({ ...baseRow, prevHash: 'abc' });

    expect(h1).not.toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).not.toBe(h4);
  });

  it('chains correctly: h2 depends on h1', () => {
    const h1 = computeHash(baseRow);
    const h2 = computeHash({ ...baseRow, sequence: '2', prevHash: h1 });
    expect(h2).not.toBe(h1);
  });
});

describe('AuditService', () => {
  let service: AuditService;
  let repo: jest.Mocked<any>;
  let sinks: jest.Mocked<any>;

  beforeEach(async () => {
    const emMock = {
      query: jest.fn(),
      getRepository: jest.fn(),
    };

    repo = {
      createQueryBuilder: jest.fn(() => buildQb()),
      find: jest.fn(),
      manager: {
        transaction: jest.fn(async (cb: any) => cb(emMock)),
        ...emMock,
      },
    };

    sinks = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(SystemAuditLog), useValue: repo },
        { provide: AuditSinksService, useValue: sinks },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log', () => {
    it('inserts a row with a hash and notifies sinks', async () => {
      const row = {
        id: 'r1',
        sequence: '1',
        hash: 'abc',
        prevHash: null,
        entityType: 'Ticket',
        entityId: 'e1',
        action: 'created',
        metadata: {},
        createdAt: new Date(),
      };

      const emMock = {
        query: jest.fn()
          .mockResolvedValueOnce(undefined)               // advisory lock
          .mockResolvedValueOnce([{ nextval: '1' }])       // nextval
          .mockResolvedValueOnce([row]),                   // INSERT RETURNING
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn(() => buildQb({ getOne: jest.fn().mockResolvedValue(null) })),
        }),
      };

      repo.manager.transaction.mockImplementation(async (cb: any) => cb(emMock));

      const result = await service.log('Ticket', 'e1', 'created', { key: 'value' });

      expect(emMock.query).toHaveBeenCalledTimes(3);
      expect(sinks.emit).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'Ticket', action: 'created' }),
      );
      expect(result).toEqual(row);
    });

    it('uses provided manager instead of starting a new transaction', async () => {
      const row = {
        id: 'r2', sequence: '5', hash: 'xyz', prevHash: null,
        entityType: 'Device', entityId: 'd1', action: 'updated', metadata: null, createdAt: new Date(),
      };

      const externalEm: any = {
        query: jest.fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce([{ nextval: '5' }])
          .mockResolvedValueOnce([row]),
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn(() => buildQb({ getOne: jest.fn().mockResolvedValue(null) })),
        }),
      };

      const result = await service.log('Device', 'd1', 'updated', undefined, externalEm);

      expect(repo.manager.transaction).not.toHaveBeenCalled();
      expect(result).toEqual(row);
    });
  });

  // ─────────────────────────────────────────
  // verifyChain
  // ─────────────────────────────────────────

  describe('verifyChain', () => {
    it('returns ok=true and total=0 for an empty log', async () => {
      repo.createQueryBuilder.mockReturnValue(buildQb({ getMany: jest.fn().mockResolvedValue([]) }));

      const result = await service.verifyChain();

      expect(result).toEqual({
        ok: true,
        total: 0,
        firstMismatchSequence: null,
        mismatchReason: null,
      });
    });

    it('returns ok=true for a valid single-entry chain', async () => {
      const row = (() => {
        const r = {
          entityType: 'Ticket',
          entityId: 'e1',
          action: 'created',
          metadata: null,
          createdAt: new Date('2024-06-01T12:00:00Z'),
          prevHash: null,
          sequence: '1',
          hash: '',
        };
        r.hash = computeHash(r);
        return r;
      })();

      repo.createQueryBuilder.mockReturnValue(buildQb({ getMany: jest.fn().mockResolvedValue([row]) }));

      const result = await service.verifyChain();

      expect(result.ok).toBe(true);
      expect(result.total).toBe(1);
    });

    it('returns ok=true for a valid two-entry chain', async () => {
      const r1: any = {
        entityType: 'T', entityId: 'e1', action: 'a1',
        metadata: null, createdAt: new Date('2024-01-01T00:00:00Z'),
        prevHash: null, sequence: '1', hash: '',
      };
      r1.hash = computeHash(r1);

      const r2: any = {
        entityType: 'T', entityId: 'e2', action: 'a2',
        metadata: null, createdAt: new Date('2024-01-01T01:00:00Z'),
        prevHash: r1.hash, sequence: '2', hash: '',
      };
      r2.hash = computeHash(r2);

      repo.createQueryBuilder.mockReturnValue(buildQb({ getMany: jest.fn().mockResolvedValue([r1, r2]) }));

      const result = await service.verifyChain();

      expect(result.ok).toBe(true);
      expect(result.total).toBe(2);
    });

    it('detects tampered hash', async () => {
      const row: any = {
        entityType: 'T', entityId: 'e1', action: 'a1',
        metadata: null, createdAt: new Date('2024-01-01T00:00:00Z'),
        prevHash: null, sequence: '1', hash: 'tampered-hash-value',
      };

      repo.createQueryBuilder.mockReturnValue(buildQb({ getMany: jest.fn().mockResolvedValue([row]) }));

      const result = await service.verifyChain();

      expect(result.ok).toBe(false);
      expect(result.mismatchReason).toBe('hash does not match recomputed value');
      expect(result.firstMismatchSequence).toBe('1');
    });

    it('detects broken prevHash link', async () => {
      const r1: any = {
        entityType: 'T', entityId: 'e1', action: 'a1',
        metadata: null, createdAt: new Date('2024-01-01T00:00:00Z'),
        prevHash: null, sequence: '1', hash: '',
      };
      r1.hash = computeHash(r1);

      const r2: any = {
        entityType: 'T', entityId: 'e2', action: 'a2',
        metadata: null, createdAt: new Date('2024-01-01T01:00:00Z'),
        prevHash: 'wrong-prev-hash',  // broken link
        sequence: '2', hash: '',
      };
      r2.hash = computeHash(r2);

      repo.createQueryBuilder.mockReturnValue(buildQb({ getMany: jest.fn().mockResolvedValue([r1, r2]) }));

      const result = await service.verifyChain();

      expect(result.ok).toBe(false);
      expect(result.mismatchReason).toBe('prevHash does not match previous record hash');
    });
  });

  // ─────────────────────────────────────────
  // list
  // ─────────────────────────────────────────

  describe('list', () => {
    it('clamps limit to 200', async () => {
      const qb = buildQb({ getMany: jest.fn().mockResolvedValue([]) });
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.list({ limit: 9999 });

      expect(qb.limit).toHaveBeenCalledWith(201);
    });

    it('applies entityType filter when provided', async () => {
      const qb = buildQb({ getMany: jest.fn().mockResolvedValue([]) });
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.list({ entityType: 'Ticket' });

      expect(qb.andWhere).toHaveBeenCalledWith('a.entityType = :et', { et: 'Ticket' });
    });

    it('sets nextCursor when results exceed limit', async () => {
      const rows = Array.from({ length: 51 }, (_, i) => ({
        id: String(i), sequence: String(i + 1),
      }));
      const qb = buildQb({ getMany: jest.fn().mockResolvedValue(rows) });
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.list({ limit: 50 });

      expect(result.items.length).toBe(50);
      expect(result.nextCursor).toBeDefined();
      expect(result.nextCursor).not.toBeNull();
    });

    it('returns nextCursor=null when results are within limit', async () => {
      const rows = [{ id: '1', sequence: '1' }];
      const qb = buildQb({ getMany: jest.fn().mockResolvedValue(rows) });
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.list({ limit: 50 });

      expect(result.nextCursor).toBeNull();
    });
  });

  // ─────────────────────────────────────────
  // getForEntity
  // ─────────────────────────────────────────

  describe('getForEntity', () => {
    it('returns sorted log entries for an entity', async () => {
      const entries = [{ id: '1', sequence: '1' }, { id: '2', sequence: '2' }];
      repo.find.mockResolvedValue(entries);

      const result = await service.getForEntity('Ticket', 'ticket-id');

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { entityType: 'Ticket', entityId: 'ticket-id' } }),
      );
      expect(result).toEqual(entries);
    });
  });
});
