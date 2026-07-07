import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { KnowledgeSpaceService } from './knowledgeSpace.service';
import { KnowledgeSpace } from 'src/entities/knowledgeSpace.entity';

const makeSpace = (overrides: any = {}): KnowledgeSpace =>
  ({ id: 'space-1', name: 'IT', authorId: 'user-1', articles: [], ...overrides } as KnowledgeSpace);

describe('KnowledgeSpaceService', () => {
  let service: KnowledgeSpaceService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (s: any) => s),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeSpaceService,
        { provide: getRepositoryToken(KnowledgeSpace), useValue: repo },
      ],
    }).compile();

    service = module.get<KnowledgeSpaceService>(KnowledgeSpaceService);
  });

  describe('findAll', () => {
    it('returns all spaces ordered by name', async () => {
      const spaces = [makeSpace()];
      repo.find.mockResolvedValue(spaces);
      const result = await service.findAll();
      expect(result).toBe(spaces);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['author'], order: { name: 'ASC' } }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when space not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });

    it('returns the space with relations when found', async () => {
      const space = makeSpace();
      repo.findOne.mockResolvedValue(space);
      const result = await service.findOne('space-1');
      expect(result).toBe(space);
    });
  });

  describe('create', () => {
    it('creates and saves a new space', async () => {
      await service.create({ name: 'HR' }, 'user-1');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'HR', authorId: 'user-1' }));
      expect(repo.save).toHaveBeenCalled();
    });

    it('ignores a client-supplied authorId in the dto', async () => {
      await service.create({ name: 'HR', authorId: 'user-9' } as any);
      const arg = repo.create.mock.calls[0][0];
      expect(arg.authorId).toBeUndefined();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when space not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost', {})).rejects.toThrow(NotFoundException);
    });

    it('merges dto and saves', async () => {
      const space = makeSpace() as any;
      repo.findOneBy.mockResolvedValue(space);
      await service.update('space-1', { name: 'Updated' });
      expect(space.name).toBe('Updated');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when space not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes and returns deleted:true', async () => {
      repo.findOneBy.mockResolvedValue(makeSpace());
      const result = await service.remove('space-1');
      expect(repo.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });
});
