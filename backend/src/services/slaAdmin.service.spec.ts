import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlaAdminService } from './slaAdmin.service';
import { SlaInstance } from 'src/entities/slaInstance.entity';

const makeInstance = (overrides: Partial<SlaInstance> = {}): SlaInstance =>
  ({
    id: 'sla-1',
    ticketId: 'ticket-1',
    breached: false,
    paused: false,
    dueAt: new Date(),
    ...overrides,
  } as SlaInstance);

describe('SlaAdminService', () => {
  let service: SlaAdminService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaAdminService,
        { provide: getRepositoryToken(SlaInstance), useValue: repo },
      ],
    }).compile();

    service = module.get<SlaAdminService>(SlaAdminService);
  });

  describe('getActive', () => {
    it('returns active (non-breached, non-paused) instances', async () => {
      const instances = [makeInstance()];
      repo.find.mockResolvedValue(instances);
      const result = await service.getActive();
      expect(result).toBe(instances);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { breached: false, paused: false } }),
      );
    });
  });

  describe('getBreaches', () => {
    it('returns breached instances', async () => {
      const instances = [makeInstance({ breached: true })];
      repo.find.mockResolvedValue(instances);
      const result = await service.getBreaches();
      expect(result).toBe(instances);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { breached: true } }),
      );
    });
  });
});
