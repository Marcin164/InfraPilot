import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomRolesService } from './customRoles.service';
import { UserCustomRole } from 'src/entities/userCustomRole.entity';
import { CustomRole } from 'src/entities/customRole.entity';
import { Users } from 'src/entities/users.entity';
import { ALL_PERMISSION_CODES } from 'src/decorators/permissions.catalog';

const mockLogoutAllUserSessions = jest.fn();
jest.mock('src/helpers/propelAuthClient', () => ({
  logoutAllUserSessions: (...args: any[]) => mockLogoutAllUserSessions(...args),
}));

const makeRole = (overrides: Partial<CustomRole> = {}): CustomRole =>
  ({
    id: 'role-1',
    name: 'Helpdesk',
    isBuiltIn: true,
    grantsAllPermissions: false,
    permissions: [],
    ...overrides,
  }) as CustomRole;

const makeAssignment = (role: CustomRole): UserCustomRole =>
  ({
    id: `assign-${role.id}`,
    userId: 'user-1',
    roleId: role.id,
    role,
  }) as UserCustomRole;

describe('CustomRolesService', () => {
  let service: CustomRolesService;
  let userCustomRoleRepo: jest.Mocked<any>;
  let customRoleRepo: jest.Mocked<any>;
  let usersRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockLogoutAllUserSessions.mockReset().mockResolvedValue(undefined);
    userCustomRoleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((x: any) => x),
      create: jest.fn((x: any) => x),
      delete: jest.fn(),
    };
    customRoleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
      remove: jest.fn(async (x: any) => x),
    };
    usersRepo = {
      findOneBy: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomRolesService,
        {
          provide: getRepositoryToken(UserCustomRole),
          useValue: userCustomRoleRepo,
        },
        { provide: getRepositoryToken(CustomRole), useValue: customRoleRepo },
        { provide: getRepositoryToken(Users), useValue: usersRepo },
      ],
    }).compile();

    service = module.get<CustomRolesService>(CustomRolesService);
  });

  describe('getUserPermissions', () => {
    it('returns an empty set when the user has no role assignments', async () => {
      userCustomRoleRepo.find.mockResolvedValue([]);

      const result = await service.getUserPermissions('user-1');

      expect(result.size).toBe(0);
      expect(userCustomRoleRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['role'],
      });
    });

    it('unions permissions across multiple assigned roles', async () => {
      const helpdesk = makeRole({
        id: 'role-helpdesk',
        permissions: ['helpdesk.tickets.access'],
      });
      const licenses = makeRole({
        id: 'role-licenses',
        permissions: ['licenses.view'],
      });
      userCustomRoleRepo.find.mockResolvedValue([
        makeAssignment(helpdesk),
        makeAssignment(licenses),
      ]);

      const result = await service.getUserPermissions('user-1');

      expect(result.has('helpdesk.tickets.access')).toBe(true);
      expect(result.has('licenses.view')).toBe(true);
      expect(result.size).toBe(2);
    });

    it('expands implied permissions (devices.view -> devices.map.view)', async () => {
      const role = makeRole({ permissions: ['devices.view'] });
      userCustomRoleRepo.find.mockResolvedValue([makeAssignment(role)]);

      const result = await service.getUserPermissions('user-1');

      expect(result.has('devices.view')).toBe(true);
      expect(result.has('devices.map.view')).toBe(true);
    });

    it('grantsAllPermissions short-circuits to the full current catalog', async () => {
      const superRole = makeRole({
        grantsAllPermissions: true,
        permissions: [],
      });
      userCustomRoleRepo.find.mockResolvedValue([makeAssignment(superRole)]);

      const result = await service.getUserPermissions('user-1');

      expect(result.size).toBe(ALL_PERMISSION_CODES.length);
      expect(result.has('admin.smtp.config')).toBe(true);
    });
  });

  describe('createRole', () => {
    it('throws when name is missing', async () => {
      await expect(service.createRole({ name: '  ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws when a role with that name already exists', async () => {
      customRoleRepo.findOne.mockResolvedValue(makeRole({ name: 'Ops' }));

      await expect(service.createRole({ name: 'Ops' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects unknown permission codes', async () => {
      customRoleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createRole({ name: 'Ops', permissions: ['not.a.real.code'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a non-built-in role with valid permissions', async () => {
      customRoleRepo.findOne.mockResolvedValue(null);

      const role = await service.createRole({
        name: 'Ops',
        description: 'ops team',
        permissions: ['devices.view'],
      });

      expect(role.isBuiltIn).toBe(false);
      expect(role.permissions).toEqual(['devices.view']);
      expect(customRoleRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('throws NotFoundException for an unknown role', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateRole('missing', { description: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates permissions on an existing role', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(makeRole({ permissions: [] }));

      const role = await service.updateRole('role-1', {
        permissions: ['licenses.view', 'licenses.add'],
      });

      expect(role.permissions).toEqual(['licenses.view', 'licenses.add']);
    });
  });

  describe('deleteRole', () => {
    it('refuses to delete a built-in role', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(makeRole({ isBuiltIn: true }));

      await expect(service.deleteRole('role-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(customRoleRepo.remove).not.toHaveBeenCalled();
    });

    it('deletes a custom (non-built-in) role', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(
        makeRole({ isBuiltIn: false }),
      );

      const result = await service.deleteRole('role-1');

      expect(result).toEqual({ success: true });
      expect(customRoleRepo.remove).toHaveBeenCalled();
    });
  });

  describe('assignRole / unassignRole', () => {
    it('throws when the user does not exist', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
      usersRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.assignRole('role-1', 'ghost-user'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when the role does not exist', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.unassignRole('missing-role', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('is idempotent: does not duplicate an existing assignment', async () => {
      const role = makeRole({ name: 'Ops' });
      customRoleRepo.findOneBy.mockResolvedValue(role);
      usersRepo.findOneBy.mockResolvedValue({ id: 'user-1' } as Users);
      userCustomRoleRepo.findOne.mockResolvedValue(makeAssignment(role));

      await service.assignRole('role-1', 'user-1');

      expect(userCustomRoleRepo.save).not.toHaveBeenCalled();
    });

    it('creates a new assignment when none exists', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
      usersRepo.findOneBy.mockResolvedValue({ id: 'user-1' } as Users);
      userCustomRoleRepo.findOne.mockResolvedValue(null);

      const result = await service.assignRole('role-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(userCustomRoleRepo.save).toHaveBeenCalled();
    });

    it('unassignRole deletes by userId/roleId', async () => {
      customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
      usersRepo.findOneBy.mockResolvedValue({ id: 'user-1' } as Users);
      userCustomRoleRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.unassignRole('role-1', 'user-1');

      expect(userCustomRoleRepo.delete).toHaveBeenCalledWith({
        userId: 'user-1',
        roleId: 'role-1',
      });
      expect(result).toEqual({ success: true });
    });

    describe('force logout on role change', () => {
      it("assignRole logs out the user's sessions when a new assignment is created", async () => {
        customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
        usersRepo.findOneBy.mockResolvedValue({
          id: 'user-1',
          authUserId: 'auth-1',
        } as Users);
        userCustomRoleRepo.findOne.mockResolvedValue(null);

        await service.assignRole('role-1', 'user-1');

        expect(mockLogoutAllUserSessions).toHaveBeenCalledWith('auth-1');
      });

      it('assignRole does not log out when the assignment already existed', async () => {
        const role = makeRole({ name: 'Ops' });
        customRoleRepo.findOneBy.mockResolvedValue(role);
        usersRepo.findOneBy.mockResolvedValue({
          id: 'user-1',
          authUserId: 'auth-1',
        } as Users);
        userCustomRoleRepo.findOne.mockResolvedValue(makeAssignment(role));

        await service.assignRole('role-1', 'user-1');

        expect(mockLogoutAllUserSessions).not.toHaveBeenCalled();
      });

      it('assignRole does not log out a user with no linked auth account', async () => {
        customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
        usersRepo.findOneBy.mockResolvedValue({ id: 'user-1' } as Users);
        userCustomRoleRepo.findOne.mockResolvedValue(null);

        await service.assignRole('role-1', 'user-1');

        expect(mockLogoutAllUserSessions).not.toHaveBeenCalled();
      });

      it("unassignRole logs out the user's sessions when an assignment is actually removed", async () => {
        customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
        usersRepo.findOneBy.mockResolvedValue({
          id: 'user-1',
          authUserId: 'auth-1',
        } as Users);
        userCustomRoleRepo.delete.mockResolvedValue({ affected: 1 });

        await service.unassignRole('role-1', 'user-1');

        expect(mockLogoutAllUserSessions).toHaveBeenCalledWith('auth-1');
      });

      it('unassignRole does not log out when nothing was actually assigned', async () => {
        customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
        usersRepo.findOneBy.mockResolvedValue({
          id: 'user-1',
          authUserId: 'auth-1',
        } as Users);
        userCustomRoleRepo.delete.mockResolvedValue({ affected: 0 });

        await service.unassignRole('role-1', 'user-1');

        expect(mockLogoutAllUserSessions).not.toHaveBeenCalled();
      });

      it('does not throw when logout fails (best-effort)', async () => {
        customRoleRepo.findOneBy.mockResolvedValue(makeRole({ name: 'Ops' }));
        usersRepo.findOneBy.mockResolvedValue({
          id: 'user-1',
          authUserId: 'auth-1',
        } as Users);
        userCustomRoleRepo.findOne.mockResolvedValue(null);
        mockLogoutAllUserSessions.mockRejectedValue(
          new Error('PropelAuth down'),
        );

        await expect(service.assignRole('role-1', 'user-1')).resolves.toEqual({
          success: true,
        });
      });
    });
  });

  describe('findUserIdsWithAnyPermission', () => {
    it('matches users whose role grants the code directly', async () => {
      const role = makeRole({ permissions: ['helpdesk.approver'] });
      userCustomRoleRepo.find.mockResolvedValue([makeAssignment(role)]);

      const result = await service.findUserIdsWithAnyPermission([
        'helpdesk.approver',
      ]);

      expect(result).toEqual(['user-1']);
    });

    it('matches users via grantsAllPermissions regardless of the explicit list', async () => {
      const role = makeRole({ grantsAllPermissions: true, permissions: [] });
      userCustomRoleRepo.find.mockResolvedValue([makeAssignment(role)]);

      const result = await service.findUserIdsWithAnyPermission([
        'helpdesk.approver',
      ]);

      expect(result).toEqual(['user-1']);
    });

    it('excludes users whose roles do not grant any of the given codes', async () => {
      const role = makeRole({ permissions: ['licenses.view'] });
      userCustomRoleRepo.find.mockResolvedValue([makeAssignment(role)]);

      const result = await service.findUserIdsWithAnyPermission([
        'helpdesk.approver',
      ]);

      expect(result).toEqual([]);
    });

    it('deduplicates a user matched by more than one role', async () => {
      const roleA = makeRole({
        id: 'role-a',
        permissions: ['helpdesk.approver'],
      });
      const roleB = makeRole({
        id: 'role-b',
        permissions: ['helpdesk.approver'],
      });
      userCustomRoleRepo.find.mockResolvedValue([
        { ...makeAssignment(roleA), userId: 'user-1' },
        { ...makeAssignment(roleB), userId: 'user-1' },
      ]);

      const result = await service.findUserIdsWithAnyPermission([
        'helpdesk.approver',
      ]);

      expect(result).toEqual(['user-1']);
    });
  });

  describe('getAssignmentsForUsers', () => {
    it('returns an empty object for an empty input', async () => {
      const result = await service.getAssignmentsForUsers([]);
      expect(result).toEqual({});
      expect(userCustomRoleRepo.find).not.toHaveBeenCalled();
    });

    it('groups role ids by user id', async () => {
      userCustomRoleRepo.find.mockResolvedValue([
        { userId: 'u1', roleId: 'r1' },
        { userId: 'u1', roleId: 'r2' },
        { userId: 'u2', roleId: 'r1' },
      ]);

      const result = await service.getAssignmentsForUsers(['u1', 'u2']);

      expect(result).toEqual({ u1: ['r1', 'r2'], u2: ['r1'] });
    });
  });
});
