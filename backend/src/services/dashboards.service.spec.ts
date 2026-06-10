import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardsService } from './dashboards.service';
import { Dashboards } from 'src/entities/dashboards.entity';

describe('DashboardsService', () => {
  let service: DashboardsService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (d: any) => d),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardsService,
        { provide: getRepositoryToken(Dashboards), useValue: repo },
      ],
    }).compile();

    service = module.get<DashboardsService>(DashboardsService);
  });

  describe('findAll', () => {
    it('returns all dashboards', async () => {
      const boards = [{ id: 'd-1', name: 'Main' }] as Dashboards[];
      repo.find.mockResolvedValue(boards);
      const result = await service.findAll();
      expect(result).toBe(boards);
    });
  });

  describe('createDashboard', () => {
    it('creates a dashboard with empty cards array', async () => {
      await service.createDashboard('Operations', 'user-1');
      const arg = repo.create.mock.calls[0][0];
      expect(arg.name).toBe('Operations');
      expect(arg.userId).toBe('user-1');
      expect(arg.cards).toEqual([]);
    });

    it('assigns a UUID id', async () => {
      await service.createDashboard('Ops', 'user-1');
      const arg = repo.create.mock.calls[0][0];
      expect(typeof arg.id).toBe('string');
      expect(arg.id.length).toBeGreaterThan(0);
    });

    it('saves and returns the created dashboard', async () => {
      const saved = { id: 'new-id', name: 'Ops', userId: 'user-1', cards: [] };
      repo.save.mockResolvedValue(saved);
      const result = await service.createDashboard('Ops', 'user-1');
      expect(result).toBe(saved);
    });
  });
});
