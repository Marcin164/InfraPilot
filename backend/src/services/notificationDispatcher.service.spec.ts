import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationDispatcherService, DispatchInput } from './notificationDispatcher.service';
import { Users } from 'src/entities/users.entity';
import { NotificationService } from './notification.service';
import { NotificationPreferencesService } from './notificationPreferences.service';
import { MailService } from './mail.service';
import { OpsNotificationsService } from './opsNotifications.service';

const user = (overrides: Partial<Users> = {}): Users =>
  ({
    id: 'user-1',
    email: 'user@acme.com',
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

const makeAdminQb = (admins: Array<{ id: string }>) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(admins),
});

describe('NotificationDispatcherService', () => {
  let service: NotificationDispatcherService;
  let usersRepo: jest.Mocked<any>;
  let inApp: jest.Mocked<NotificationService>;
  let prefs: jest.Mocked<NotificationPreferencesService>;
  let mail: jest.Mocked<MailService>;
  let opsNotifications: jest.Mocked<OpsNotificationsService>;

  beforeEach(async () => {
    usersRepo = {
      find: jest.fn().mockResolvedValue([user()]),
      findOne: jest.fn().mockResolvedValue(user()),
      createQueryBuilder: jest.fn().mockReturnValue(makeAdminQb([])),
    };
    inApp = { create: jest.fn().mockResolvedValue({}) } as any;
    prefs = { isEnabled: jest.fn().mockResolvedValue(true) } as any;
    mail = { send: jest.fn().mockResolvedValue(undefined) } as any;
    opsNotifications = {
      getConfig: jest.fn().mockResolvedValue({ emails: [], channels: {} }),
      getChannelsForEvent: jest.fn().mockResolvedValue({ inapp: true, email: true }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDispatcherService,
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: NotificationService, useValue: inApp },
        { provide: NotificationPreferencesService, useValue: prefs },
        { provide: MailService, useValue: mail },
        { provide: OpsNotificationsService, useValue: opsNotifications },
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
    });

    it('sends email to the account\'s own address when prefs enable it (no per-user override)', async () => {
      prefs.isEnabled.mockImplementation(async (uid, event, channel) => channel === 'email');
      usersRepo.find.mockResolvedValue([user({ email: 'user@acme.com' })]);

      await service.dispatch(baseDispatch());

      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@acme.com', subject: 'Ticket assigned' }),
      );
    });

    it('does not send email when user has no email address', async () => {
      prefs.isEnabled.mockResolvedValue(true);
      usersRepo.find.mockResolvedValue([user({ email: null as any })]);

      await service.dispatch(baseDispatch());

      expect(mail.send).not.toHaveBeenCalled();
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

      await expect(service.dispatch(baseDispatch())).resolves.not.toThrow();
    });

    it('sends to all channels when all preferences are enabled', async () => {
      prefs.isEnabled.mockResolvedValue(true);

      await service.dispatch(baseDispatch());

      expect(inApp.create).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('test', () => {
    it('uses the account\'s own login email, no separate override', async () => {
      usersRepo.findOne.mockResolvedValue(user({ email: 'me@acme.com' }));

      const result = await service.test('user-1');

      expect(result.emailAddress).toBe('me@acme.com');
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'me@acme.com' }),
      );
    });
  });

  describe('dispatchOpsAlert', () => {
    it('does nothing on either channel when both are disabled', async () => {
      opsNotifications.getChannelsForEvent.mockResolvedValue({ inapp: false, email: false });

      await service.dispatchOpsAlert({
        event: 'device_down' as any,
        title: 'Device unreachable',
        body: 'No response',
      });

      expect(mail.send).not.toHaveBeenCalled();
      expect(inApp.create).not.toHaveBeenCalled();
    });

    it('fans out in-app to every admin when the in-app channel is on', async () => {
      opsNotifications.getChannelsForEvent.mockResolvedValue({ inapp: true, email: false });
      usersRepo.createQueryBuilder.mockReturnValue(
        makeAdminQb([{ id: 'admin-1' }, { id: 'admin-2' }]),
      );

      await service.dispatchOpsAlert({
        event: 'device_down' as any,
        title: 'Device unreachable',
        body: 'No response',
      });

      expect(inApp.create).toHaveBeenCalledTimes(2);
      expect(inApp.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipientId: 'admin-1', title: 'Device unreachable' }),
      );
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('emails every configured ops address when the email channel is on', async () => {
      opsNotifications.getChannelsForEvent.mockResolvedValue({ inapp: false, email: true });
      opsNotifications.getConfig.mockResolvedValue({
        emails: ['ops@acme.com', 'noc@acme.com'],
        channels: {} as any,
      });

      await service.dispatchOpsAlert({
        event: 'device_down' as any,
        title: 'Device unreachable',
        body: 'No response',
      });

      expect(inApp.create).not.toHaveBeenCalled();
      expect(mail.send).toHaveBeenCalledTimes(2);
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ops@acme.com', subject: 'Device unreachable' }),
      );
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'noc@acme.com', subject: 'Device unreachable' }),
      );
    });

    it('never checks per-user preferences for ops alerts', async () => {
      opsNotifications.getChannelsForEvent.mockResolvedValue({ inapp: true, email: true });
      opsNotifications.getConfig.mockResolvedValue({ emails: ['ops@acme.com'], channels: {} as any });
      usersRepo.createQueryBuilder.mockReturnValue(makeAdminQb([{ id: 'admin-1' }]));

      await service.dispatchOpsAlert({
        event: 'device_down' as any,
        title: 'Device unreachable',
        body: 'No response',
      });

      expect(prefs.isEnabled).not.toHaveBeenCalled();
    });

    it('a failure sending to one ops email does not stop the others', async () => {
      opsNotifications.getChannelsForEvent.mockResolvedValue({ inapp: false, email: true });
      opsNotifications.getConfig.mockResolvedValue({
        emails: ['bad@acme.com', 'ops@acme.com'],
        channels: {} as any,
      });
      mail.send.mockRejectedValueOnce(new Error('SMTP error')).mockResolvedValueOnce(undefined);

      await expect(
        service.dispatchOpsAlert({
          event: 'device_down' as any,
          title: 'Device unreachable',
          body: 'No response',
        }),
      ).resolves.not.toThrow();

      expect(mail.send).toHaveBeenCalledTimes(2);
    });
  });
});
