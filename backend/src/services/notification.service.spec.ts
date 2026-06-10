import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService, CreateNotificationInput } from './notification.service';
import { Notification } from 'src/entities/notification.entity';
import { Users } from 'src/entities/users.entity';

const baseInput = (): CreateNotificationInput => ({
  recipientId: 'user-1',
  type: 'assignment' as any,
  title: 'Test notification',
  body: 'Test body',
  url: '/admin/tickets/1',
  entityType: 'Ticket',
  entityId: 'ticket-1',
  actorId: 'actor-1',
});

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: jest.Mocked<any>;
  let users: jest.Mocked<any>;

  beforeEach(async () => {
    const updateQb: any = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const selectQb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repo = {
      save: jest.fn(async (rows: any) => rows),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn((alias?: string) =>
        alias ? selectQb : updateQb,
      ),
    };

    users = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useValue: repo },
        { provide: getRepositoryToken(Users), useValue: users },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('create', () => {
    it('saves a single notification and returns it', async () => {
      const input = baseInput();
      const saved = { id: 'notif-1', ...input };
      repo.save.mockResolvedValue(saved);

      const result = await service.create(input);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(saved);
    });

    it('sets readAt to null on creation', async () => {
      repo.save.mockImplementation(async (row: any) => row);
      await service.create(baseInput());

      const savedRow = repo.save.mock.calls[0][0];
      expect(savedRow.readAt).toBeNull();
    });

    it('persists all provided fields', async () => {
      const input = baseInput();
      repo.save.mockImplementation(async (row: any) => row);

      await service.create(input);

      const row = repo.save.mock.calls[0][0];
      expect(row.recipientId).toBe(input.recipientId);
      expect(row.title).toBe(input.title);
      expect(row.body).toBe(input.body);
      expect(row.entityType).toBe(input.entityType);
    });
  });

  describe('createMany', () => {
    it('returns 0 and skips save for empty input', async () => {
      const count = await service.createMany([]);
      expect(repo.save).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });

    it('saves all rows and returns count', async () => {
      const inputs = [baseInput(), { ...baseInput(), recipientId: 'user-2' }];
      repo.save.mockImplementation(async (rows: any) => rows);

      const count = await service.createMany(inputs);

      expect(repo.save).toHaveBeenCalledTimes(1);
      const rows = repo.save.mock.calls[0][0];
      expect(rows).toHaveLength(2);
      expect(count).toBe(2);
    });
  });

  describe('markRead', () => {
    it('returns affected count after update', async () => {
      const result = await service.markRead('user-1', ['notif-1', 'notif-2']);
      expect(result).toBe(1);
    });

    it('returns 0 without calling the DB when ids array is empty', async () => {
      const result = await service.markRead('user-1', []);
      expect(result).toBe(0);
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('markAllRead', () => {
    it('calls update via query builder and returns affected count', async () => {
      const result = await service.markAllRead('user-1');
      expect(result).toBe(1);
    });
  });

  describe('unreadCount', () => {
    it('returns the count of unread notifications', async () => {
      repo.count.mockResolvedValue(5);

      const count = await service.unreadCount('user-1');

      expect(count).toBe(5);
      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ recipientId: 'user-1' }) }),
      );
    });
  });
});
