import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesGuard } from './rolesGuard.guard';
import { Users } from 'src/entities/users.entity';
import { Role, ROLES_KEY } from 'src/decorators/roles.decorator';

jest.mock('src/helpers/propelAuthClient', () => ({
  validateAccessTokenAndGetUserClass: jest.fn(),
}));

import { validateAccessTokenAndGetUserClass } from 'src/helpers/propelAuthClient';

const validateMock = validateAccessTokenAndGetUserClass as jest.MockedFunction<
  typeof validateAccessTokenAndGetUserClass
>;

const adminUser = (): Users =>
  ({
    id: 'admin-uuid',
    email: 'admin@acme.com',
    authUserId: 'auth-1',
    isAdmin: true,
    isHelpdesk: false,
    isAuditor: false,
    isApprover: false,
    isCompliance: false,
    isDpo: false,
  } as unknown as Users);

const helpdeskUser = (): Users =>
  ({
    id: 'helpdesk-uuid',
    email: 'agent@acme.com',
    authUserId: 'auth-2',
    isAdmin: false,
    isHelpdesk: true,
    isAuditor: false,
    isApprover: false,
    isCompliance: false,
    isDpo: false,
  } as unknown as Users);

const buildContext = (options: {
  headers?: Record<string, string>;
  user?: any;
  requiredRoles?: Role[];
} = {}): ExecutionContext => {
  const req: any = {
    headers: options.headers ?? {},
    user: options.user ?? undefined,
  };

  const reflectorMock: any = {
    getAllAndOverride: jest.fn().mockReturnValue(options.requiredRoles ?? undefined),
  };

  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
    _req: req,
    _reflector: reflectorMock,
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let usersRepo: jest.Mocked<any>;

  beforeEach(async () => {
    usersRepo = {
      findOneBy: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
        { provide: getRepositoryToken(Users), useValue: usersRepo },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    jest.clearAllMocks();
  });

  const makeCtx = (req: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext);

  it('allows access when no @Roles() decorator is present', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const ctx = makeCtx({ headers: {} });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('allows access when @Roles([]) is empty', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);
    const ctx = makeCtx({ headers: {} });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('throws UnauthorizedException when roles required but no Authorization header', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Helpdesk]);
    const ctx = makeCtx({ headers: {} });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when token validation fails', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
    validateMock.mockRejectedValue(new Error('invalid'));
    const ctx = makeCtx({ headers: { authorization: 'Bearer bad-token' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws ForbiddenException when user is not found in the database', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Helpdesk]);
    validateMock.mockResolvedValue({ userId: 'auth-1', email: 'x@x.com' } as any);
    usersRepo.findOneBy.mockResolvedValue(null);

    const ctx = makeCtx({ headers: { authorization: 'Bearer token' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when user lacks the required role', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Auditor]);
    const user = helpdeskUser();
    validateMock.mockResolvedValue({ userId: user.authUserId } as any);
    usersRepo.findOneBy.mockResolvedValue(user);

    const ctx = makeCtx({ headers: { authorization: 'Bearer token' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns true when user has the required role', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Helpdesk]);
    const user = helpdeskUser();
    validateMock.mockResolvedValue({ userId: user.authUserId } as any);
    usersRepo.findOneBy.mockResolvedValue(user);

    const req: any = { headers: { authorization: 'Bearer token' } };
    const ctx = makeCtx(req);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req.appUser).toEqual(user);
  });

  it('admin always passes regardless of the required role', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Compliance]);
    const user = adminUser();
    validateMock.mockResolvedValue({ userId: user.authUserId } as any);
    usersRepo.findOneBy.mockResolvedValue(user);

    const req: any = { headers: { authorization: 'Bearer token' } };
    const ctx = makeCtx(req);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('skips token validation when req.user is already populated', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Helpdesk]);
    const user = helpdeskUser();
    usersRepo.findOneBy.mockResolvedValue(user);

    const req: any = {
      user: {
        userId: user.authUserId,
        properties: { metadata: { id: user.id } },
      },
      headers: {},
    };
    const ctx = makeCtx(req);

    const result = await guard.canActivate(ctx);

    expect(validateMock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('resolves user by email when id and authUserId lookups return nothing', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Helpdesk]);
    const user = helpdeskUser();
    // Return a token payload with only email (no userId/id/user_id),
    // so the guard skips the authId lookup and goes straight to email lookup.
    validateMock.mockResolvedValue({ email: user.email } as any);
    usersRepo.findOneBy.mockResolvedValue(user);

    const ctx = makeCtx({ headers: { authorization: 'Bearer token' } });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(usersRepo.findOneBy).toHaveBeenCalledWith({ email: user.email });
  });

  it('backfills authUserId when it is missing from the DB record', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.Admin]);
    const user = { ...adminUser(), authUserId: null as any };
    validateMock.mockResolvedValue({ userId: 'auth-new-id' } as any);
    usersRepo.findOneBy.mockResolvedValue(user);

    const ctx = makeCtx({ headers: { authorization: 'Bearer token' } });
    await guard.canActivate(ctx);

    expect(usersRepo.update).toHaveBeenCalledWith(user.id, { authUserId: 'auth-new-id' });
  });
});
