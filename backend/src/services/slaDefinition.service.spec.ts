import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SlaDefinitionService } from './slaDefinition.service';
import { SlaDefinition } from 'src/entities/slaDefinition.entity';
import { Calendar } from 'src/entities/calendar.entity';

const makeSlaDef = (overrides: any = {}): SlaDefinition =>
  ({ id: 'def-1', name: 'Response SLA', targetMinutes: 120, calendar: { id: 'cal-1' }, ...overrides } as SlaDefinition);

const makeCalendar = (): Calendar =>
  ({ id: 'cal-1', name: 'Default' } as Calendar);

describe('SlaDefinitionService', () => {
  let service: SlaDefinitionService;
  let slaRepo: jest.Mocked<any>;
  let calendarRepo: jest.Mocked<any>;

  beforeEach(async () => {
    slaRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (s: any) => s),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    calendarRepo = {
      findOne: jest.fn().mockResolvedValue(makeCalendar()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaDefinitionService,
        { provide: getRepositoryToken(SlaDefinition), useValue: slaRepo },
        { provide: getRepositoryToken(Calendar), useValue: calendarRepo },
      ],
    }).compile();

    service = module.get<SlaDefinitionService>(SlaDefinitionService);
  });

  describe('getAll', () => {
    it('returns all SLA definitions with calendar relation', async () => {
      const defs = [makeSlaDef()];
      slaRepo.find.mockResolvedValue(defs);
      const result = await service.getAll();
      expect(result).toBe(defs);
      expect(slaRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['calendar'] }),
      );
    });
  });

  describe('create', () => {
    it('throws NotFoundException when calendar not found', async () => {
      calendarRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ name: 'SLA', targetMinutes: 60, calendarId: 'ghost' })).rejects.toThrow(NotFoundException);
    });

    it('creates and saves the SLA definition with the resolved calendar', async () => {
      const calendar = makeCalendar();
      calendarRepo.findOne.mockResolvedValue(calendar);

      await service.create({ name: 'SLA', targetMinutes: 60, calendarId: 'cal-1' });

      expect(slaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SLA', targetMinutes: 60, calendar }),
      );
      expect(slaRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when SLA definition not found', async () => {
      slaRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost', {})).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when new calendarId does not resolve', async () => {
      slaRepo.findOne.mockResolvedValue(makeSlaDef());
      calendarRepo.findOne.mockResolvedValue(null);
      await expect(service.update('def-1', { calendarId: 'ghost' })).rejects.toThrow(NotFoundException);
    });

    it('updates name and targetMinutes', async () => {
      const def = makeSlaDef();
      slaRepo.findOne.mockResolvedValue(def);
      await service.update('def-1', { name: 'Updated', targetMinutes: 240 });
      expect(slaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated', targetMinutes: 240 }),
      );
    });

    it('replaces calendar when calendarId is provided', async () => {
      const def = makeSlaDef();
      const newCalendar = { id: 'cal-2', name: 'New Calendar' } as Calendar;
      slaRepo.findOne.mockResolvedValue(def);
      calendarRepo.findOne.mockResolvedValue(newCalendar);

      await service.update('def-1', { calendarId: 'cal-2' });

      expect(def.calendar).toBe(newCalendar);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when SLA definition not found', async () => {
      slaRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes the SLA definition and returns deleted:true', async () => {
      slaRepo.findOne.mockResolvedValue(makeSlaDef());
      const result = await service.delete('def-1');
      expect(slaRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });
});
