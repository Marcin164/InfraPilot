import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SlaRuntimeService } from './slaRuntime.service';
import { SlaInstance } from 'src/entities/slaInstance.entity';
import { SlaEscalationInstance } from 'src/entities/slaEscalationInstance.entity';
import { BusinessTimeService } from './businessTime.service';

const calendar = { id: 'cal-1' } as any;

const makeInstance = (overrides: Partial<SlaInstance> = {}): SlaInstance =>
  ({
    id: 'sla-1',
    ticketId: 'ticket-1',
    breached: false,
    paused: false,
    dueAt: new Date(Date.now() + 3600 * 1000),
    slaDefinition: {
      id: 'def-1',
      name: 'Response',
      type: 'response',
      targetMinutes: 120,
      calendar,
    },
    ...overrides,
  } as SlaInstance);

describe('SlaRuntimeService', () => {
  let service: SlaRuntimeService;
  let slaRepo: jest.Mocked<any>;
  let businessTime: jest.Mocked<BusinessTimeService>;

  beforeEach(async () => {
    slaRepo = { find: jest.fn().mockResolvedValue([]) };
    businessTime = {
      calculateBusinessMinutesBetween: jest.fn().mockResolvedValue(60),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaRuntimeService,
        { provide: getRepositoryToken(SlaInstance), useValue: slaRepo },
        { provide: getRepositoryToken(SlaEscalationInstance), useValue: {} },
        { provide: BusinessTimeService, useValue: businessTime },
      ],
    }).compile();

    service = module.get<SlaRuntimeService>(SlaRuntimeService);
  });

  describe('getForTicket', () => {
    it('throws NotFoundException when ticket has no SLA instances', async () => {
      slaRepo.find.mockResolvedValue([]);
      await expect(service.getForTicket('no-sla-ticket')).rejects.toThrow(NotFoundException);
    });

    it('returns ACTIVE status for a non-breached, non-paused instance', async () => {
      slaRepo.find.mockResolvedValue([makeInstance()]);
      const result = await service.getForTicket('ticket-1');
      const inst = result.instances[0];
      expect(inst.status).toBe('ACTIVE');
    });

    it('returns BREACHED status and 0 remaining minutes for a breached instance', async () => {
      slaRepo.find.mockResolvedValue([makeInstance({ breached: true })]);
      const result = await service.getForTicket('ticket-1');
      const inst = result.instances[0];
      expect(inst.status).toBe('BREACHED');
      expect(inst.remainingMinutes).toBe(0);
    });

    it('returns PAUSED status for a paused instance', async () => {
      slaRepo.find.mockResolvedValue([makeInstance({ paused: true })]);
      const result = await service.getForTicket('ticket-1');
      const inst = result.instances[0];
      expect(inst.status).toBe('PAUSED');
    });

    it('includes usedPercentage capped at 100', async () => {
      businessTime.calculateBusinessMinutesBetween.mockResolvedValue(0);
      slaRepo.find.mockResolvedValue([makeInstance()]);
      const result = await service.getForTicket('ticket-1');
      expect(result.instances[0].usedPercentage).toBe(100);
    });

    it('includes remainingMinutes from businessTime calculation', async () => {
      businessTime.calculateBusinessMinutesBetween.mockResolvedValue(60);
      slaRepo.find.mockResolvedValue([makeInstance()]);
      const result = await service.getForTicket('ticket-1');
      expect(result.instances[0].remainingMinutes).toBe(60);
    });

    it('returns instances array with one item per SLA', async () => {
      slaRepo.find.mockResolvedValue([makeInstance(), makeInstance({ id: 'sla-2' })]);
      const result = await service.getForTicket('ticket-1');
      expect(result.instances).toHaveLength(2);
    });
  });
});
