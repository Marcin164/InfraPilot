import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketAutoTagService } from './ticketAutoTag.service';
import { TicketAutoTagRule } from 'src/entities/ticketAutoTagRule.entity';

const makeRule = (overrides: Partial<TicketAutoTagRule> = {}): TicketAutoTagRule =>
  ({
    id: 'rule-1',
    name: 'Network / VPN',
    keywords: 'vpn,network,wifi',
    category: 'Network',
    priority: 100,
    enabled: true,
    ...overrides,
  } as TicketAutoTagRule);

describe('TicketAutoTagService', () => {
  let service: TicketAutoTagService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (r: any) => r),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketAutoTagService,
        { provide: getRepositoryToken(TicketAutoTagRule), useValue: repo },
      ],
    }).compile();

    service = module.get<TicketAutoTagService>(TicketAutoTagService);
  });

  // ─────────────────────────────────────────
  // suggestCategory
  // ─────────────────────────────────────────

  describe('suggestCategory', () => {
    it('returns null for empty text', async () => {
      const result = await service.suggestCategory('');
      expect(result).toBeNull();
    });

    it('returns null for whitespace-only text', async () => {
      const result = await service.suggestCategory('   ');
      expect(result).toBeNull();
    });

    it('returns null when no rule matches', async () => {
      repo.find.mockResolvedValue([makeRule()]);
      const result = await service.suggestCategory('unrelated content here');
      expect(result).toBeNull();
    });

    it('returns matching category when keyword found in text', async () => {
      repo.find.mockResolvedValue([makeRule()]);
      const result = await service.suggestCategory('I cannot connect to vpn');
      expect(result).not.toBeNull();
      expect(result?.category).toBe('Network');
      expect(result?.matchedKeyword).toBe('vpn');
    });

    it('matches keywords case-insensitively', async () => {
      repo.find.mockResolvedValue([makeRule()]);
      const result = await service.suggestCategory('VPN issue reported');
      expect(result?.category).toBe('Network');
    });

    it('uses the highest-priority rule when multiple match', async () => {
      const low = makeRule({ id: 'r1', name: 'Low', keywords: 'network', category: 'LowPri', priority: 50 });
      const high = makeRule({ id: 'r2', name: 'High', keywords: 'network', category: 'HighPri', priority: 100 });
      // find returns high first (ordered by priority DESC)
      repo.find.mockResolvedValue([high, low]);

      const result = await service.suggestCategory('network problem');
      expect(result?.category).toBe('HighPri');
    });

    it('trims whitespace around keywords', async () => {
      repo.find.mockResolvedValue([makeRule({ keywords: ' vpn , network , wifi ' })]);
      const result = await service.suggestCategory('wifi dropped');
      expect(result?.category).toBe('Network');
    });
  });

  // ─────────────────────────────────────────
  // seedDefaults
  // ─────────────────────────────────────────

  describe('seedDefaults', () => {
    it('inserts rules that do not yet exist', async () => {
      repo.findOneBy.mockResolvedValue(null); // none exist
      const count = await service.seedDefaults();
      expect(count).toBeGreaterThan(0);
      expect(repo.save).toHaveBeenCalled();
    });

    it('skips rules that already exist', async () => {
      repo.findOneBy.mockResolvedValue(makeRule()); // all exist
      const count = await service.seedDefaults();
      expect(count).toBe(0);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // list
  // ─────────────────────────────────────────

  describe('list', () => {
    it('returns all rules ordered by priority DESC then name ASC', async () => {
      const rules = [makeRule()];
      repo.find.mockResolvedValue(rules);
      const result = await service.list();
      expect(result).toBe(rules);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: expect.objectContaining({ priority: 'DESC' }) }),
      );
    });
  });

  // ─────────────────────────────────────────
  // upsert
  // ─────────────────────────────────────────

  describe('upsert', () => {
    it('creates a new rule when name does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await service.upsert({ name: 'New Rule', keywords: 'test', category: 'Test' });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('updates existing rule when name matches', async () => {
      const existing = makeRule();
      repo.findOneBy.mockResolvedValue(existing);
      await service.upsert({ name: 'Network / VPN', keywords: 'new,keywords' });
      expect(existing.keywords).toBe('new,keywords');
      expect(repo.save).toHaveBeenCalledWith(existing);
    });
  });

  // ─────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────

  describe('remove', () => {
    it('deletes the rule by id', async () => {
      await service.remove('rule-1');
      expect(repo.delete).toHaveBeenCalledWith({ id: 'rule-1' });
    });
  });
});
