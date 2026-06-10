import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { KnowledgeArticleService } from './knowledgeArticle.service';
import { KnowledgeArticle } from 'src/entities/knowledgeArticle.entity';

const makeArticle = (overrides: Partial<KnowledgeArticle> = {}): KnowledgeArticle =>
  ({
    id: 'article-1',
    spaceId: 'space-1',
    title: 'How to reset VPN',
    content: 'Step by step guide...',
    category: 'Network',
    authorId: 'user-1',
    views: 0,
    ...overrides,
  } as KnowledgeArticle);

describe('KnowledgeArticleService', () => {
  let service: KnowledgeArticleService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    const qb: any = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (a: any) => ({ id: 'article-1', ...a })),
      increment: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeArticleService,
        { provide: getRepositoryToken(KnowledgeArticle), useValue: repo },
      ],
    }).compile();

    service = module.get<KnowledgeArticleService>(KnowledgeArticleService);
  });

  // ─────────────────────────────────────────
  // findBySpace
  // ─────────────────────────────────────────

  describe('findBySpace', () => {
    it('returns articles for the given space', async () => {
      const articles = [makeArticle()];
      repo.find.mockResolvedValue(articles);
      const result = await service.findBySpace('space-1');
      expect(result).toBe(articles);
    });

    it('filters by category when provided', async () => {
      await service.findBySpace('space-1', 'Network');
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ spaceId: 'space-1', category: 'Network' }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────
  // findOne
  // ─────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException when article not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns article and increments view count', async () => {
      const article = makeArticle();
      repo.findOne.mockResolvedValue(article);
      const result = await service.findOne('article-1');
      expect(result).toBe(article);
      expect(repo.increment).toHaveBeenCalledWith({ id: 'article-1' }, 'views', 1);
    });
  });

  // ─────────────────────────────────────────
  // search
  // ─────────────────────────────────────────

  describe('search', () => {
    it('returns matching articles', async () => {
      const articles = [makeArticle()];
      repo.find.mockResolvedValue(articles);
      const result = await service.search('vpn');
      expect(result).toBe(articles);
    });

    it('limits results to 50', async () => {
      await service.search('test');
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  // ─────────────────────────────────────────
  // create
  // ─────────────────────────────────────────

  describe('create', () => {
    it('creates and saves article with authorId', async () => {
      await service.create({ title: 'New Article', content: 'Content' }, 'user-1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ authorId: 'user-1' }),
      );
      expect(repo.save).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // update
  // ─────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when article not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost', { title: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('updates fields and saves', async () => {
      const article = makeArticle();
      repo.findOneBy.mockResolvedValue(article);
      await service.update('article-1', { title: 'Updated Title' });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Title' }),
      );
    });
  });

  // ─────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when article not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes article and returns deleted:true', async () => {
      repo.findOneBy.mockResolvedValue(makeArticle());
      const result = await service.remove('article-1');
      expect(repo.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  // ─────────────────────────────────────────
  // listCategoriesBySpace
  // ─────────────────────────────────────────

  describe('listCategoriesBySpace', () => {
    it('returns category counts from query builder', async () => {
      const rows = [{ category: 'Network', count: 3 }];
      repo.createQueryBuilder().getRawMany.mockResolvedValue(rows);
      const result = await service.listCategoriesBySpace('space-1');
      expect(result).toEqual(rows);
    });
  });
});
