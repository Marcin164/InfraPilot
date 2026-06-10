import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationPreferencesService } from './notificationPreferences.service';
import {
  NOTIFICATION_EVENTS,
  NotificationPreference,
} from 'src/entities/notificationPreference.entity';

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (r: any) => r),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        { provide: getRepositoryToken(NotificationPreference), useValue: repo },
      ],
    }).compile();

    service = module.get<NotificationPreferencesService>(NotificationPreferencesService);
  });

  // ─────────────────────────────────────────
  // isEnabled
  // ─────────────────────────────────────────

  describe('isEnabled', () => {
    it('returns stored value when a preference row exists (enabled)', async () => {
      repo.findOne.mockResolvedValue({ enabled: true });
      const result = await service.isEnabled('user-1', 'ticket_assigned', 'email');
      expect(result).toBe(true);
    });

    it('returns stored value when a preference row exists (disabled)', async () => {
      repo.findOne.mockResolvedValue({ enabled: false });
      const result = await service.isEnabled('user-1', 'ticket_assigned', 'inapp');
      expect(result).toBe(false);
    });

    it('returns true by default for inapp channel on any event', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.isEnabled('user-1', 'ticket_assigned', 'inapp');
      expect(result).toBe(true);
    });

    it('returns true by default for email on ticket_assigned', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.isEnabled('user-1', 'ticket_assigned', 'email');
      expect(result).toBe(true);
    });

    it('returns false by default for SMS on non-critical event', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.isEnabled('user-1', 'ticket_comment', 'sms');
      expect(result).toBe(false);
    });

    it('returns true by default for SMS on ticket_sla_breach', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.isEnabled('user-1', 'ticket_sla_breach', 'sms');
      expect(result).toBe(true);
    });

    it('returns true by default for SMS on cve_critical', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.isEnabled('user-1', 'cve_critical', 'sms');
      expect(result).toBe(true);
    });
  });

  // ─────────────────────────────────────────
  // listForUser
  // ─────────────────────────────────────────

  describe('listForUser', () => {
    it('returns rows for every event × channel combination', async () => {
      const result = await service.listForUser('user-1');
      const expectedCount = NOTIFICATION_EVENTS.length * 3; // inapp, email, sms
      expect(result.length).toBe(expectedCount);
    });

    it('uses stored enabled value when preference row exists', async () => {
      const stored = [{
        userId: 'user-1',
        event: 'ticket_assigned',
        channel: 'email',
        enabled: false,
      }];
      repo.find.mockResolvedValue(stored);

      const result = await service.listForUser('user-1');
      const emailRow = result.find(
        (r) => r.event === 'ticket_assigned' && r.channel === 'email',
      );
      expect(emailRow?.enabled).toBe(false);
    });

    it('falls back to defaults when no preference row exists', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.listForUser('user-1');
      const smsRow = result.find(
        (r) => r.event === 'ticket_comment' && r.channel === 'sms',
      );
      expect(smsRow?.enabled).toBe(false);
    });
  });

  // ─────────────────────────────────────────
  // setMany
  // ─────────────────────────────────────────

  describe('setMany', () => {
    it('returns 0 and makes no saves for empty input', async () => {
      const count = await service.setMany('user-1', []);
      expect(count).toBe(0);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates a new preference row when none exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const count = await service.setMany('user-1', [
        { event: 'ticket_assigned', channel: 'email', enabled: false },
      ]);

      expect(count).toBe(1);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('updates an existing row when enabled value changed', async () => {
      const existing = { id: 'pref-1', enabled: true, event: 'ticket_assigned', channel: 'email' };
      repo.findOne.mockResolvedValue(existing);

      const count = await service.setMany('user-1', [
        { event: 'ticket_assigned', channel: 'email', enabled: false },
      ]);

      expect(count).toBe(1);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });

    it('skips a row when enabled value did not change', async () => {
      const existing = { id: 'pref-1', enabled: false, event: 'ticket_assigned', channel: 'email' };
      repo.findOne.mockResolvedValue(existing);

      const count = await service.setMany('user-1', [
        { event: 'ticket_assigned', channel: 'email', enabled: false },
      ]);

      expect(count).toBe(0);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
