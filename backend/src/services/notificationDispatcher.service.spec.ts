import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationDispatcherService, DispatchInput } from './notificationDispatcher.service';
import { Users } from 'src/entities/users.entity';
import { UserSettings } from 'src/entities/userSettings.entity';
import { NotificationService } from './notification.service';
import { NotificationPreferencesService } from './notificationPreferences.service';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';

const user = (overrides: Partial<Users> = {}): Users =>
  ({
    id: 'user-1',
    email: 'user@acme.com',
    phone: '+48123456789',
    ...overrides,
  } as Users);

const baseDispatch = (): DispatchInput => ({
  recipientIds: ['user-1'],
  event: 'ticket_assigned' as any,
  title: 'Ticket assigned',
  body: 'You have a new ticket',
  url: '/admin/tickets/1',
  entityType: 'Ticket',
  entityId: 'ticket-1',
  actorId: 'actor-1',
});

describe('NotificationDispatcherService', () => {
  let service: NotificationDispatcherService;
  let usersRepo: jest.Mocked<any>;
  let inApp: jest.Mocked<NotificationService>;
  let prefs: jest.Mocked<NotificationPreferencesService>;
  let mail: jest.Mocked<MailService>;
  let sms: jest.Mocked<SmsService>;

  beforeEach(async () => {
    usersRepo = { find: jest.fn().mockResolvedValue([user()]) };
    const userSettingsRepo = { findOne: jest.fn().mockResolvedValue(null) };
    inApp = { create: jest.fn().mockResolvedValue({}) } as any;
    prefs = { isEnabled: jest.fn().mockResolvedValue(true) } as any;
    mail = { send: jest.fn().mockResolvedValue(undefined) } as any;
    sms = { send: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDispatcherService,
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: getRepositoryToken(UserSettings), useValue: userSettingsRepo },
        { provide: NotificationService, useValue: inApp },
        { provide: NotificationPreferencesService, useValue: prefs },
        { provide: MailService, useValue: mail },
        { provide: SmsService, useValue: sms },
      ],
    }).compile();

    service = module.get<NotificationDispatcherService>(NotificationDispatcherService);
  });

  describe('dispatch', () => {
    it('skips when recipientIds is empty', async () => {
      await service.dispatch({ ...baseDispatch(), recipientIds: [] });

      expect(usersRepo.find).not.toHaveBeenCalled();
      expect(inApp.create).not.toHaveBeenCalled();
    });

    it('deduplicates recipient ids', async () => {
      await service.dispatch({ ...baseDispatch(), recipientIds: ['user-1', 'user-1', 'user-1'] });

      expect(usersRepo.find).toHaveBeenCalledTimes(1);
      expect(inApp.create).toHaveBeenCalledTimes(1);
    });

    it('sends in-app notification when prefs enable it', async () => {
      prefs.isEnabled.mockImplementation(async (uid, event, channel) => channel === 'inapp');

      await service.dispatch(baseDispatch());

      expect(inApp.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipientId: 'user-1', title: 'Ticket assigned' }),
      );
      expect(mail.send).not.toHaveBeenCalled();
      expect(sms.send).not.toHaveBeenCalled();
    });

    it('sends email when prefs enable it and user has email', async () => {
      prefs.isEnabled.mockImplementation(async (uid, event, channel) => channel === 'email');
      usersRepo.find.mockResolvedValue([user({ email: 'user@acme.com', phone: null as any })]);

      await service.dispatch(baseDispatch());

      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@acme.com', subject: 'Ticket assigned' }),
      );
      expect(sms.send).not.toHaveBeenCalled();
    });

    it('sends SMS when prefs enable it and user has phone', async () => {
      prefs.isEnabled.mockImplementation(async (uid, event, channel) => channel === 'sms');
      usersRepo.find.mockResolvedValue([user({ email: null as any, phone: '+48123456789' })]);

      await service.dispatch(baseDispatch());

      expect(sms.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: '+48123456789' }),
      );
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('does not send email when user has no email address', async () => {
      prefs.isEnabled.mockResolvedValue(true);
      usersRepo.find.mockResolvedValue([user({ email: null as any })]);

      await service.dispatch(baseDispatch());

      expect(mail.send).not.toHaveBeenCalled();
    });

    it('does not send SMS when user has no phone number', async () => {
      prefs.isEnabled.mockResolvedValue(true);
      usersRepo.find.mockResolvedValue([user({ phone: null as any })]);

      await service.dispatch(baseDispatch());

      expect(sms.send).not.toHaveBeenCalled();
    });

    it('skips unknown recipients (user not found)', async () => {
      usersRepo.find.mockResolvedValue([]); // no user found

      await service.dispatch(baseDispatch());

      expect(inApp.create).not.toHaveBeenCalled();
    });

    it('channel failures are best-effort and do not throw', async () => {
      prefs.isEnabled.mockResolvedValue(true);
      inApp.create.mockRejectedValue(new Error('DB down'));
      mail.send.mockRejectedValue(new Error('SMTP error'));
      sms.send.mockRejectedValue(new Error('SMS error'));

      await expect(service.dispatch(baseDispatch())).resolves.not.toThrow();
    });

    it('sends to all channels when all preferences are enabled', async () => {
      prefs.isEnabled.mockResolvedValue(true);

      await service.dispatch(baseDispatch());

      expect(inApp.create).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(sms.send).toHaveBeenCalledTimes(1);
    });
  });
});
