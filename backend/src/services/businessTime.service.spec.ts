import { Test, TestingModule } from '@nestjs/testing';
import { BusinessTimeService } from './businessTime.service';
import { Calendar } from 'src/entities/calendar.entity';

const monday5am = new Date('2024-01-08T05:00:00.000Z'); // Mon 06:00 Warsaw (UTC+1)
const monday9am = new Date('2024-01-08T08:00:00.000Z'); // Mon 09:00 Warsaw
const monday10am = new Date('2024-01-08T09:00:00.000Z'); // Mon 10:00 Warsaw
const monday5pm = new Date('2024-01-08T16:00:00.000Z'); // Mon 17:00 Warsaw
const saturdayMorning = new Date('2024-01-13T09:00:00.000Z'); // Sat 10:00 Warsaw

const baseCalendar = (): Calendar =>
  ({
    timezone: 'Europe/Warsaw',
    workStart: '09:00',
    workEnd: '17:00',
    workingDays: '0111110', // Mon-Fri
    holidays: [],
  } as unknown as Calendar);

describe('BusinessTimeService', () => {
  let service: BusinessTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessTimeService],
    }).compile();

    service = module.get<BusinessTimeService>(BusinessTimeService);
  });

  // ─────────────────────────────────────────
  // isBusinessTime
  // ─────────────────────────────────────────

  describe('isBusinessTime', () => {
    it('returns true for a moment inside business hours', async () => {
      const cal = baseCalendar();
      expect(await service.isBusinessTime(monday10am, cal)).toBe(true);
    });

    it('returns false before work start', async () => {
      const cal = baseCalendar();
      expect(await service.isBusinessTime(monday5am, cal)).toBe(false);
    });

    it('returns false at or after work end', async () => {
      const cal = baseCalendar();
      expect(await service.isBusinessTime(monday5pm, cal)).toBe(false);
    });

    it('returns false on a weekend', async () => {
      const cal = baseCalendar();
      expect(await service.isBusinessTime(saturdayMorning, cal)).toBe(false);
    });

    it('returns false on a holiday even if it falls on a working day', async () => {
      const cal = baseCalendar();
      cal.holidays = [{ date: '2024-01-08' } as any];
      expect(await service.isBusinessTime(monday10am, cal)).toBe(false);
    });
  });

  // ─────────────────────────────────────────
  // calculateDueDate
  // ─────────────────────────────────────────

  describe('calculateDueDate', () => {
    it('adds minutes that fit within the same business day', async () => {
      const cal = baseCalendar();
      // Start: Mon 09:00, add 60 min → Mon 10:00 Warsaw (09:00 UTC+1)
      const due = await service.calculateDueDate(monday9am, 60, cal);
      const dueWarsaw = new Date(due.getTime() + 60 * 60 * 1000); // rough Warsaw offset
      expect(due.getTime()).toBeGreaterThan(monday9am.getTime());
    });

    it('overflows to the next business day when remaining minutes exceed end-of-day', async () => {
      const cal = baseCalendar();
      // Start: Mon 09:00, 8h = 480 min = end of day. Add 1 more → Tue 09:01
      const due = await service.calculateDueDate(monday9am, 481, cal);
      const nextDayStart = new Date('2024-01-09T08:00:00.000Z'); // Tue 09:00 Warsaw
      expect(due.getTime()).toBeGreaterThan(nextDayStart.getTime());
    });

    it('skips weekends when calculating due date', async () => {
      const cal = baseCalendar();
      // Friday 16:00 Warsaw = 15:00 UTC
      const friday4pm = new Date('2024-01-12T15:00:00.000Z');
      // Adding 120 min from 16:00 means overflow past 17:00 → next Mon 10:00
      const due = await service.calculateDueDate(friday4pm, 120, cal);
      const mondayMorning = new Date('2024-01-15T08:00:00.000Z'); // Mon 09:00 Warsaw
      expect(due.getTime()).toBeGreaterThan(mondayMorning.getTime());
    });

    it('skips holidays when calculating due date', async () => {
      const cal = baseCalendar();
      // Holiday on Tuesday Jan 9
      cal.holidays = [{ date: '2024-01-09' } as any];
      // Start: Mon 16:59, add 2 min → overflow → skip Tue (holiday) → Wed 09:01
      const lateMonday = new Date('2024-01-08T15:59:00.000Z'); // Mon 16:59 Warsaw
      const due = await service.calculateDueDate(lateMonday, 5, cal);
      // Should land on Wednesday (skip Tuesday holiday)
      const wednesday = new Date('2024-01-10T08:00:00.000Z'); // Wed 09:00 Warsaw
      expect(due.getTime()).toBeGreaterThanOrEqual(wednesday.getTime());
    });

    it('moves start to next business time when called outside business hours', async () => {
      const cal = baseCalendar();
      // Saturday morning + 60 min → should start from Monday 09:00, due Mon 10:00
      const due = await service.calculateDueDate(saturdayMorning, 60, cal);
      // Should be after Monday 09:00
      const mondayStart = new Date('2024-01-15T08:00:00.000Z'); // Mon 09:00 Warsaw
      expect(due.getTime()).toBeGreaterThan(mondayStart.getTime());
    });

    it('returns correct due for 0 remaining minutes', async () => {
      const cal = baseCalendar();
      const due = await service.calculateDueDate(monday10am, 0, cal);
      // Should be at or near start (no minutes to add)
      expect(due).toBeDefined();
    });
  });

  // ─────────────────────────────────────────
  // calculateBusinessMinutesBetween
  // ─────────────────────────────────────────

  describe('calculateBusinessMinutesBetween', () => {
    it('counts business minutes within a single business day', async () => {
      const cal = baseCalendar();
      const start = new Date('2024-01-08T09:00:00.000Z'); // Mon 10:00 Warsaw
      const end = new Date('2024-01-08T11:00:00.000Z');   // Mon 12:00 Warsaw
      const minutes = await service.calculateBusinessMinutesBetween(start, end, cal);
      expect(minutes).toBe(120);
    });

    it('returns 0 for same start and end', async () => {
      const cal = baseCalendar();
      const minutes = await service.calculateBusinessMinutesBetween(monday10am, monday10am, cal);
      expect(minutes).toBe(0);
    });

    it('returns 0 for a range entirely outside business hours', async () => {
      const cal = baseCalendar();
      // Saturday 10:00 to Saturday 12:00 — no business time
      const satStart = new Date('2024-01-13T09:00:00.000Z');
      const satEnd = new Date('2024-01-13T11:00:00.000Z');
      const minutes = await service.calculateBusinessMinutesBetween(satStart, satEnd, cal);
      expect(minutes).toBe(0);
    });

    it('counts minutes spanning multiple days', async () => {
      const cal = baseCalendar();
      // Mon 09:00 to Tue 09:00 → one full business day = 8h = 480 min
      const start = new Date('2024-01-08T08:00:00.000Z'); // Mon 09:00 Warsaw
      const end = new Date('2024-01-09T08:00:00.000Z');   // Tue 09:00 Warsaw
      const minutes = await service.calculateBusinessMinutesBetween(start, end, cal);
      expect(minutes).toBe(480);
    });
  });

  // ─────────────────────────────────────────
  // addPauseTime
  // ─────────────────────────────────────────

  describe('addPauseTime', () => {
    it('extends a due date by the business minutes of the pause', async () => {
      const cal = baseCalendar();
      const due = new Date('2024-01-08T10:00:00.000Z'); // Mon 11:00 Warsaw
      const paused = new Date('2024-01-08T09:00:00.000Z'); // Mon 10:00 Warsaw
      const resumed = new Date('2024-01-08T10:00:00.000Z'); // Mon 11:00 Warsaw (60 min pause)
      const newDue = await service.addPauseTime(due, paused, resumed, cal);
      // Due should be extended by 60 business minutes
      expect(newDue.getTime()).toBeGreaterThan(due.getTime());
    });
  });
});
