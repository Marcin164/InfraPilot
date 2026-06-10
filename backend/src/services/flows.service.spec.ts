import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FlowsService } from './flows.service';
import { Flows } from 'src/entities/flows.entity';

describe('FlowsService', () => {
  let service: FlowsService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowsService,
        { provide: getRepositoryToken(Flows), useValue: repo },
      ],
    }).compile();

    service = module.get<FlowsService>(FlowsService);
  });

  describe('findAll', () => {
    it('returns all flows', async () => {
      const flows = [{ id: 'f-1' }] as Flows[];
      repo.find.mockResolvedValue(flows);
      const result = await service.findAll();
      expect(result).toBe(flows);
      expect(repo.find).toHaveBeenCalled();
    });

    it('returns empty array when no flows exist', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
