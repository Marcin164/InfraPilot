import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';
import { Users } from 'src/entities/users.entity';
import { UsersService } from './users.service';
import { CustomRolesService } from './customRoles.service';

// UsersService transitively imports propelAuthClient, which throws at
// module-load time unless PROPELAUTH_AUTH_URL/PROPELAUTH_API_KEY are set.
// The DI below fully replaces it with a plain mock anyway, so replace the
// whole module rather than requiring real PropelAuth env vars for this test.
jest.mock('./users.service', () => ({
  UsersService: class UsersService {},
}));

// CustomRolesService also imports propelAuthClient directly now (for the
// force-logout on role change) -- same problem, same fix.
jest.mock('src/helpers/propelAuthClient', () => ({
  logoutAllUserSessions: jest.fn(),
}));

describe('BootstrapService', () => {
  let service: BootstrapService;
  let usersRepo: jest.Mocked<any>;
  let usersService: jest.Mocked<any>;
  let customRolesService: jest.Mocked<any>;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    usersRepo = {
      count: jest.fn().mockResolvedValue(0),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    usersService = {
      provisionInAuth: jest
        .fn()
        .mockResolvedValue({ created: true, authUserId: 'auth-1' }),
    };
    customRolesService = {
      listRoles: jest.fn().mockResolvedValue([]),
      assignRole: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapService,
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: UsersService, useValue: usersService },
        { provide: CustomRolesService, useValue: customRolesService },
      ],
    }).compile();

    service = module.get<BootstrapService>(BootstrapService);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('does nothing when ADMIN_EMAIL is not set', async () => {
    delete process.env.ADMIN_EMAIL;

    await service.onApplicationBootstrap();

    expect(usersRepo.count).not.toHaveBeenCalled();
    expect(usersRepo.insert).not.toHaveBeenCalled();
  });

  it('does nothing when the users table already has rows', async () => {
    process.env.ADMIN_EMAIL = 'admin@acme.com';
    usersRepo.count.mockResolvedValue(3);

    await service.onApplicationBootstrap();

    expect(usersRepo.insert).not.toHaveBeenCalled();
    expect(customRolesService.listRoles).not.toHaveBeenCalled();
  });

  it('creates the first user and assigns the built-in Administrator role when it exists', async () => {
    process.env.ADMIN_EMAIL = 'admin@acme.com';
    customRolesService.listRoles.mockResolvedValue([
      { id: 'role-approver', name: 'Approver', isBuiltIn: true },
      { id: 'role-admin', name: 'Administrator', isBuiltIn: true },
    ]);

    await service.onApplicationBootstrap();

    expect(usersRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@acme.com',
      }),
    );
    const insertedId = usersRepo.insert.mock.calls[0][0].id;
    expect(customRolesService.assignRole).toHaveBeenCalledWith(
      'role-admin',
      insertedId,
    );
    expect(usersService.provisionInAuth).toHaveBeenCalledWith(insertedId);
  });

  it('does not crash when the built-in Administrator role does not exist yet', async () => {
    process.env.ADMIN_EMAIL = 'admin@acme.com';
    customRolesService.listRoles.mockResolvedValue([]);

    await expect(service.onApplicationBootstrap()).resolves.not.toThrow();

    expect(usersRepo.insert).toHaveBeenCalled();
    expect(customRolesService.assignRole).not.toHaveBeenCalled();
    expect(usersService.provisionInAuth).toHaveBeenCalled();
  });

  it('does not crash and still provisions auth when assignRole itself throws', async () => {
    process.env.ADMIN_EMAIL = 'admin@acme.com';
    customRolesService.listRoles.mockResolvedValue([
      { id: 'role-admin', name: 'Administrator', isBuiltIn: true },
    ]);
    customRolesService.assignRole.mockRejectedValue(new Error('db down'));

    await expect(service.onApplicationBootstrap()).resolves.not.toThrow();

    expect(usersService.provisionInAuth).toHaveBeenCalled();
  });

  it('ignores a non-built-in role that happens to be named Administrator', async () => {
    process.env.ADMIN_EMAIL = 'admin@acme.com';
    customRolesService.listRoles.mockResolvedValue([
      { id: 'role-custom', name: 'Administrator', isBuiltIn: false },
    ]);

    await service.onApplicationBootstrap();

    expect(customRolesService.assignRole).not.toHaveBeenCalled();
  });
});
