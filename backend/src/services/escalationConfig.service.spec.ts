import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EscalationConfigService } from './escalationConfig.service';
import { SlaEscalationDefinition } from 'src/entities/slaEscalationDefinition.entity';
import { SlaDefinition } from 'src/entities/slaDefinition.entity';

const makeEscalation = (overrides: any = {}): SlaEscalationDefinition =>
  ({ id: 'esc-1', triggerPercentage: 75, actionType: 'notify', slaDefinition: { id: 'def-1', name: 'Response' }, ...overrides } as SlaEscalationDefinition);

describe('EscalationConfigService', () => {
  let service: EscalationConfigService;
  let escalationRepo: jest.Mocked<any>;
  let slaDefRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    escalationRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (e: any) => e),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    slaDefRepo = { findOneBy: jest.fn().mockResolvedValue({ id: 'def-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationConfigService,
        { provide: getRepositoryToken(SlaEscalationDefinition), useValue: escalationRepo },
        { provide: getRepositoryToken(SlaDefinition), useValue: slaDefRepo },
      ],
    }).compile();

    service = module.get<EscalationConfigService>(EscalationConfigService);
  });

  describe('getAll', () => {
    it('returns all escalation definitions', async () => {
      const escs = [makeEscalation()];
      escalationRepo.find.mockResolvedValue(escs);
      const result = await service.getAll();
      expect(result).toBe(escs);
    });
  });

  describe('create', () => {
    it('throws NotFoundException when SLA definition not found', async () => {
      slaDefRepo.findOneBy.mockResolvedValue(null);
      await expect(service.create({ definition: 'ghost', triggerPercentage: 75 })).rejects.toThrow(NotFoundException);
    });

    it('creates and saves escalation definition', async () => {
      await service.create({ definition: 'def-1', triggerPercentage: 75, actionType: 'notify' });
      expect(escalationRepo.create).toHaveBeenCalled();
      expect(escalationRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when escalation not found', async () => {
      escalationRepo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost', {})).rejects.toThrow(NotFoundException);
    });

    it('updates fields and saves', async () => {
      const esc = makeEscalation() as any;
      escalationRepo.findOneBy.mockResolvedValue(esc);
      await service.update('esc-1', { triggerPercentage: 90 });
      expect(esc.triggerPercentage).toBe(90);
      expect(escalationRepo.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when escalation not found', async () => {
      escalationRepo.findOneBy.mockResolvedValue(null);
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes escalation and returns deleted:true', async () => {
      escalationRepo.findOneBy.mockResolvedValue(makeEscalation());
      const result = await service.delete('esc-1');
      expect(escalationRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('getEscalationsGroupedBySla', () => {
    it('groups escalations by SLA definition', async () => {
      escalationRepo.createQueryBuilder().getMany.mockResolvedValue([
        makeEscalation({ id: 'e1', triggerPercentage: 75 }),
        makeEscalation({ id: 'e2', triggerPercentage: 90 }),
      ]);
      const result = await service.getEscalationsGroupedBySla();
      expect(result).toHaveLength(1); // same slaDefinition.id
      expect(result[0].escalations).toHaveLength(2);
    });

    it('returns empty array when no escalations exist', async () => {
      escalationRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      const result = await service.getEscalationsGroupedBySla();
      expect(result).toEqual([]);
    });
  });
});
