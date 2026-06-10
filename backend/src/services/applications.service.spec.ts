import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service';
import { Applications } from 'src/entities/applications.entity';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    const qb: any = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: getRepositoryToken(Applications), useValue: repo },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('findAll', () => {
    it('returns all applications', async () => {
      const apps = [{ id: 'app-1' }] as Applications[];
      repo.find.mockResolvedValue(apps);
      const result = await service.findAll();
      expect(result).toBe(apps);
    });
  });

  describe('findAllTable', () => {
    it('calls query builder and returns raw results', async () => {
      const rows = [{ id: 'app-1', name: 'Chrome', count: '5' }];
      repo.createQueryBuilder().getRawMany.mockResolvedValue(rows);
      const result = await service.findAllTable();
      expect(result).toBe(rows);
    });
  });

  describe('getFilterOptions', () => {
    it('returns publisher filter options', async () => {
      const values = [{ value: 'Google' }, { value: 'Microsoft' }];
      repo.createQueryBuilder().getRawMany.mockResolvedValue(values);
      const result = await service.getFilterOptions();
      expect(result.publisher).toEqual(['Google', 'Microsoft']);
    });

    it('returns empty publisher list when no distinct values', async () => {
      const result = await service.getFilterOptions();
      expect(result.publisher).toEqual([]);
    });
  });

  describe('findApplication', () => {
    it('returns null when application not found', async () => {
      const result = await service.findApplication('ghost');
      expect(result).toBeNull();
    });

    it('returns application when found', async () => {
      const app = { id: 'app-1', name: 'Chrome' } as Applications;
      repo.findOneBy.mockResolvedValue(app);
      const result = await service.findApplication('app-1');
      expect(result).toBe(app);
    });
  });

  describe('searchByName', () => {
    it('returns empty array when query is empty', async () => {
      const result = await service.searchByName('');
      expect(result).toEqual([]);
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('calls query builder and returns matching names', async () => {
      const names = [{ name: 'Chrome' }];
      repo.createQueryBuilder().getRawMany.mockResolvedValue(names);
      const result = await service.searchByName('chro');
      expect(result).toBe(names);
    });
  });
});
