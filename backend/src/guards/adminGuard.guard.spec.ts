import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './adminGuard.guard';
import { Users } from 'src/entities/users.entity';

const adminUser = (): Users =>
  ({ id: 'user-1', authUserId: 'auth-1', email: 'admin@acme.com', isAdmin: true } as Users);

const regularUser = (): Users =>
  ({ id: 'user-2', authUserId: 'auth-2', email: 'user@acme.com', isAdmin: false } as Users);

const makeCtx = (reqUser: Record<string, any>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user: reqUser }) }),
  } as unknown as ExecutionContext);

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let usersRepo: jest.Mocked<any>;

  beforeEach(async () => {
    usersRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        { provide: getRepositoryToken(Users), useValue: usersRepo },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  it('throws ForbiddenException when no user is found at all', async () => {
    usersRepo.findOneBy.mockResolvedValue(null);
    const ctx = makeCtx({ userId: 'nobody', email: 'nobody@acme.com' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is not admin', async () => {
    usersRepo.findOneBy.mockResolvedValue(regularUser());
    const ctx = makeCtx({ userId: 'auth-2' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('returns true for an admin user found by authId', async () => {
    usersRepo.findOneBy.mockResolvedValue(adminUser());
    const ctx = makeCtx({ userId: 'auth-1' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('finds user by internalId from properties.metadata.id first', async () => {
    usersRepo.findOneBy.mockResolvedValue(adminUser());
    const ctx = makeCtx({
      userId: 'auth-1',
      properties: { metadata: { id: 'user-1' } },
    });
    await guard.canActivate(ctx);
    expect(usersRepo.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
  });

  it('falls back to email lookup when authId yields nothing', async () => {
    usersRepo.findOneBy
      .mockResolvedValueOnce(null) // authId lookup
      .mockResolvedValueOnce(adminUser()); // email lookup

    const ctx = makeCtx({ userId: 'auth-unknown', email: 'admin@acme.com' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('backfills authUserId when it is missing on the resolved user', async () => {
    const userWithoutAuthId = { ...adminUser(), authUserId: null } as any;
    usersRepo.findOneBy.mockResolvedValue(userWithoutAuthId);

    const ctx = makeCtx({ userId: 'new-auth-id', email: 'admin@acme.com' });
    await guard.canActivate(ctx);

    expect(usersRepo.update).toHaveBeenCalledWith(userWithoutAuthId.id, {
      authUserId: 'new-auth-id',
    });
  });

  it('does not call update when authUserId is already set', async () => {
    usersRepo.findOneBy.mockResolvedValue(adminUser());
    const ctx = makeCtx({ userId: 'auth-1' });
    await guard.canActivate(ctx);
    expect(usersRepo.update).not.toHaveBeenCalled();
  });
});
