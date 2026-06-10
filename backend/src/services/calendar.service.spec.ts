import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Calendar } from 'src/entities/calendar.entity';
import { CalendarHoliday } from 'src/entities/calendarHoliday.entity';

const makeCalendar = (overrides: Partial<Calendar> = {}): Calendar =>
  ({
    id: 'cal-1',
    name: 'Default',
    timezone: 'Europe/Warsaw',
    workingDays: '0111110',
    workStart: '09:00',
    workEnd: '17:00',
    holidays: [],
    ...overrides,
  } as Calendar);

const makeHoliday = (): CalendarHoliday =>
  ({ id: 'hol-1', calendarId: 'cal-1', date: new Date('2024-01-01'), description: "New Year's Day" } as CalendarHoliday);

describe('CalendarService', () => {
  let service: CalendarService;
  let calendarRepo: jest.Mocked<any>;
  let holidayRepo: jest.Mocked<any>;

  beforeEach(async () => {
    calendarRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (c: any) => ({ id: 'cal-1', ...c })),
      preload: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    holidayRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn(async (h: any) => h),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: getRepositoryToken(Calendar), useValue: calendarRepo },
        { provide: getRepositoryToken(CalendarHoliday), useValue: holidayRepo },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  // ─────────────────────────────────────────
  // getAll
  // ─────────────────────────────────────────

  describe('getAll', () => {
    it('returns all calendars with holidays', async () => {
      const calendars = [makeCalendar()];
      calendarRepo.find.mockResolvedValue(calendars);
      const result = await service.getAll();
      expect(result).toBe(calendars);
      expect(calendarRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['holidays'] }),
      );
    });
  });

  // ─────────────────────────────────────────
  // create
  // ─────────────────────────────────────────

  describe('create', () => {
    it('creates and saves a new calendar', async () => {
      const dto = { name: 'EU Calendar', workingDays: '0111110', timezone: 'UTC' };
      await service.create(dto);
      expect(calendarRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'EU Calendar' }),
      );
      expect(calendarRepo.save).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // update
  // ─────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when calendar is not found', async () => {
      calendarRepo.preload.mockResolvedValue(null);
      await expect(
        service.update('ghost', { name: 'X', workingDays: [], timezone: 'UTC' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('saves updated calendar', async () => {
      const calendar = makeCalendar();
      calendarRepo.preload.mockResolvedValue(calendar);
      await service.update('cal-1', { name: 'Updated', workingDays: [], timezone: 'UTC' });
      expect(calendarRepo.save).toHaveBeenCalledWith(calendar);
    });
  });

  // ─────────────────────────────────────────
  // addHoliday
  // ─────────────────────────────────────────

  describe('addHoliday', () => {
    it('throws NotFoundException when calendar is not found', async () => {
      calendarRepo.findOne.mockResolvedValue(null);
      await expect(
        service.addHoliday('ghost', { date: '2024-01-01', description: 'Holiday' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates and saves the holiday', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      await service.addHoliday('cal-1', { date: '2024-01-01', description: "New Year's Day" });
      expect(holidayRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ calendarId: 'cal-1', date: new Date('2024-01-01') }),
      );
      expect(holidayRepo.save).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  // deleteHoliday
  // ─────────────────────────────────────────

  describe('deleteHoliday', () => {
    it('throws NotFoundException when holiday is not found', async () => {
      holidayRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteHoliday('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes the holiday and returns deleted:true', async () => {
      holidayRepo.findOne.mockResolvedValue(makeHoliday());
      const result = await service.deleteHoliday('hol-1');
      expect(holidayRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  // ─────────────────────────────────────────
  // delete
  // ─────────────────────────────────────────

  describe('delete', () => {
    it('throws NotFoundException when calendar is not found', async () => {
      calendarRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('removes the calendar and returns deleted:true', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      const result = await service.delete('cal-1');
      expect(calendarRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });
});
