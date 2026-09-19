import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShiftsService } from './shifts.service';
import { Shift } from 'src/entities/shift.entity';
import { Users } from 'src/entities/users.entity';
import { CustomRolesService } from './customRoles.service';

// CustomRolesService imports propelAuthClient (for the force-logout on role
// change), which throws at module-load time without real PropelAuth env
// vars. The DI below fully replaces CustomRolesService with a mock, but
// importing the real class file still runs its top-level imports.
jest.mock('src/helpers/propelAuthClient', () => ({
  logoutAllUserSessions: jest.fn(),
}));

describe('ShiftsService', () => {
  let service: ShiftsService;
  let repo: jest.Mocked<any>;
  let usersRepo: jest.Mocked<any>;
  let customRolesService: jest.Mocked<any>;
  let queryBuilder: jest.Mocked<any>;

  const ADMIN_CALLER_ID = 'admin-1';

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn((v: any) => v),
      save: jest
        .fn()
        .mockImplementation((s: any) =>
          Promise.resolve({ id: 'new-shift', ...s }),
        ),
      findOneBy: jest.fn(),
      remove: jest.fn().mockImplementation((s: any) => Promise.resolve(s)),
    };
    usersRepo = {
      findOneBy: jest.fn().mockResolvedValue({ id: ADMIN_CALLER_ID }),
    };
    customRolesService = {
      // Default: caller has shifts.edit, so existing tests (not about
      // permissions) don't need to think about manager matching.
      getUserPermissions: jest.fn().mockResolvedValue(new Set(['shifts.edit'])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: getRepositoryToken(Shift), useValue: repo },
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: CustomRolesService, useValue: customRolesService },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
  });

  describe('create', () => {
    const dto = {
      userId: 'user-1',
      type: 'Work',
      startDate: '2026-09-08',
      endDate: '2026-09-09',
    };

    it('rejects a shift whose dates overlap an existing shift for the same user', async () => {
      queryBuilder.getOne.mockResolvedValue({ id: 'existing-shift' });

      await expect(service.create(dto, ADMIN_CALLER_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates the shift when no overlapping shift exists for the user', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      const shift = await service.create(dto, ADMIN_CALLER_ID);

      expect(repo.save).toHaveBeenCalled();
      expect(shift.userId).toBe('user-1');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the shift does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { comment: 'hi' }, ADMIN_CALLER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('updates only the fields provided, leaving others untouched', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 's1',
        type: 'Work',
        comment: 'old comment',
      });

      const shift = await service.update(
        's1',
        { comment: 'new comment' },
        ADMIN_CALLER_ID,
      );

      expect(shift.type).toBe('Work');
      expect(shift.comment).toBe('new comment');
    });

    it('rejects a date edit that overlaps another shift for the same user', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        startDate: new Date('2026-09-08'),
        endDate: new Date('2026-09-09'),
      });
      queryBuilder.getOne.mockResolvedValue({ id: 'other-shift' });

      await expect(
        service.update(
          's1',
          { startDate: '2026-09-08T10:00:00.000Z' },
          ADMIN_CALLER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('excludes the shift itself from the overlap check when editing its own dates', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        startDate: new Date('2026-09-08'),
        endDate: new Date('2026-09-09'),
      });
      queryBuilder.getOne.mockResolvedValue(null);

      await service.update(
        's1',
        { startDate: '2026-09-08T10:00:00.000Z' },
        ADMIN_CALLER_ID,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'shift.id != :excludeId',
        { excludeId: 's1' },
      );
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the shift does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.remove('missing-id', ADMIN_CALLER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('removes an existing shift', async () => {
      repo.findOneBy.mockResolvedValue({ id: 's1' });

      const result = await service.remove('s1', ADMIN_CALLER_ID);

      expect(repo.remove).toHaveBeenCalled();
      expect(result).toEqual({ id: 's1' });
    });
  });

  describe('assertCanManage (via update)', () => {
    beforeEach(() => {
      repo.findOneBy.mockResolvedValue({
        id: 's1',
        userId: 'employee-1',
        type: 'Work',
        comment: null,
      });
    });

    it("rejects a caller who has neither shifts.edit nor is the employee's manager", async () => {
      customRolesService.getUserPermissions.mockResolvedValue(new Set());
      usersRepo.findOneBy.mockImplementation(({ id }: { id: string }) =>
        Promise.resolve(
          id === 'caller-1'
            ? { id: 'caller-1', username: 'caller.name' }
            : { id: 'employee-1', manager: 'someone.else' },
        ),
      );

      await expect(
        service.update('s1', { comment: 'hi' }, 'caller-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("allows the employee's manager, matched by username, even without shifts.edit", async () => {
      customRolesService.getUserPermissions.mockResolvedValue(new Set());
      usersRepo.findOneBy.mockImplementation(({ id }: { id: string }) =>
        Promise.resolve(
          id === 'manager-1'
            ? { id: 'manager-1', username: 'manager.name' }
            : { id: 'employee-1', manager: 'manager.name' },
        ),
      );

      const shift = await service.update('s1', { comment: 'hi' }, 'manager-1');

      expect(shift.comment).toBe('hi');
      expect(repo.save).toHaveBeenCalled();
    });

    it('allows a caller with shifts.edit regardless of the manager field', async () => {
      customRolesService.getUserPermissions.mockResolvedValue(
        new Set(['shifts.edit']),
      );
      usersRepo.findOneBy.mockImplementation(({ id }: { id: string }) =>
        Promise.resolve(
          id === ADMIN_CALLER_ID
            ? { id: ADMIN_CALLER_ID }
            : { id: 'employee-1', manager: 'someone.else' },
        ),
      );

      const shift = await service.update(
        's1',
        { comment: 'hi' },
        ADMIN_CALLER_ID,
      );

      expect(shift.comment).toBe('hi');
      expect(repo.save).toHaveBeenCalled();
    });
  });
});
