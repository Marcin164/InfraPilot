import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionsGuard } from './permissions.guard';
import { Users } from 'src/entities/users.entity';
import { CustomRolesService } from 'src/services/customRoles.service';

jest.mock('src/helpers/propelAuthClient', () => ({
  validateAccessTokenAndGetUserClass: jest.fn(),
}));

import { validateAccessTokenAndGetUserClass } from 'src/helpers/propelAuthClient';

const validateMock = validateAccessTokenAndGetUserClass as jest.MockedFunction<
  typeof validateAccessTokenAndGetUserClass
>;

const regularUser = (): Users =>
  ({
    id: 'user-uuid',
    email: 'agent@acme.com',
    authUserId: 'auth-2',
  }) as unknown as Users;

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let usersRepo: jest.Mocked<any>;
  let customRolesService: jest.Mocked<any>;

  beforeEach(async () => {
    usersRepo = {
      findOneBy: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    customRolesService = { getUserPermissions: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
        { provide: getRepositoryToken(Users), useValue: usersRepo },
        { provide: CustomRolesService, useValue: customRolesService },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get(Reflector);

    jest.clearAllMocks();
  });

  const makeCtx = (req: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  it('allows access when no @RequiresPermission() decorator is present', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const result = await guard.canActivate(makeCtx({ headers: {} }));

    expect(result).toBe(true);
    expect(customRolesService.getUserPermissions).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when a permission is required but there is no Authorization header', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'devices.view',
    ]);

    await expect(
      guard.canActivate(makeCtx({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws ForbiddenException when the user has none of the required permissions', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'devices.view',
    ]);
    const user = regularUser();
    validateMock.mockResolvedValue({ userId: user.authUserId } as any);
    usersRepo.findOneBy.mockResolvedValue(user);
    customRolesService.getUserPermissions.mockResolvedValue(
      new Set(['licenses.view']),
    );

    await expect(
      guard.canActivate(
        makeCtx({ headers: { authorization: 'Bearer token' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns true when the user has one of the required permissions', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'devices.view',
      'devices.add',
    ]);
    const user = regularUser();
    validateMock.mockResolvedValue({ userId: user.authUserId } as any);
    usersRepo.findOneBy.mockResolvedValue(user);
    customRolesService.getUserPermissions.mockResolvedValue(
      new Set(['devices.add']),
    );

    const req: any = { headers: { authorization: 'Bearer token' } };
    const result = await guard.canActivate(makeCtx(req));

    expect(result).toBe(true);
    expect(req.appUser).toEqual(user);
  });

  it('returns true when the user has grantsAllPermissions-derived access to every code', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'admin.smtp.config',
    ]);
    const user = regularUser();
    validateMock.mockResolvedValue({ userId: user.authUserId } as any);
    usersRepo.findOneBy.mockResolvedValue(user);
    customRolesService.getUserPermissions.mockResolvedValue(
      new Set(['admin.smtp.config']),
    );

    const result = await guard.canActivate(
      makeCtx({ headers: { authorization: 'Bearer token' } }),
    );

    expect(result).toBe(true);
  });

  it('throws ForbiddenException when the user cannot be resolved from the token', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'devices.view',
    ]);
    validateMock.mockResolvedValue({ userId: 'ghost' } as any);
    usersRepo.findOneBy.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        makeCtx({ headers: { authorization: 'Bearer token' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
