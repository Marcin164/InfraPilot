import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MfaGuard } from './mfaGuard.guard';

// jest.mock is hoisted — use a factory-level reference instead of a closed-over variable
jest.mock('src/helpers/propelAuthClient', () => ({
  propelAuth: {
    fetchUserMfaMethods: jest.fn(),
  },
}));

// Re-import after mock is installed so we can spy on the same instance
import { propelAuth } from 'src/helpers/propelAuthClient';
const mockFetchUserMfaMethods = (propelAuth as any).fetchUserMfaMethods as jest.Mock;

const makeCtx = (userId: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user: { userId } }),
    }),
  } as unknown as ExecutionContext);

describe('MfaGuard', () => {
  let guard: MfaGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MfaGuard],
    }).compile();

    guard = module.get<MfaGuard>(MfaGuard);
  });

  describe('when MFA_REQUIRED is not set', () => {
    beforeEach(() => {
      delete process.env.MFA_REQUIRED;
    });

    it('passes through without calling PropelAuth', async () => {
      const result = await guard.canActivate(makeCtx('user-off'));
      expect(result).toBe(true);
      expect(mockFetchUserMfaMethods).not.toHaveBeenCalled();
    });
  });

  describe('when MFA_REQUIRED=true', () => {
    beforeEach(() => {
      process.env.MFA_REQUIRED = 'true';
    });

    afterEach(() => {
      delete process.env.MFA_REQUIRED;
    });

    it('throws ForbiddenException when user context is missing', async () => {
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('returns true when user has totpEnabled', async () => {
      mockFetchUserMfaMethods.mockResolvedValue({ totpEnabled: true });
      const result = await guard.canActivate(makeCtx('user-totp'));
      expect(result).toBe(true);
    });

    it('returns true when user has backupCodesEnabled', async () => {
      mockFetchUserMfaMethods.mockResolvedValue({ backupCodesEnabled: true });
      const result = await guard.canActivate(makeCtx('user-backup'));
      expect(result).toBe(true);
    });

    it('returns true when user has smsEnabled', async () => {
      mockFetchUserMfaMethods.mockResolvedValue({ smsEnabled: true });
      const result = await guard.canActivate(makeCtx('user-sms'));
      expect(result).toBe(true);
    });

    it('returns true when user has non-empty methods array', async () => {
      mockFetchUserMfaMethods.mockResolvedValue({ methods: ['totp'] });
      const result = await guard.canActivate(makeCtx('user-methods'));
      expect(result).toBe(true);
    });

    it('throws ForbiddenException when user has no MFA methods', async () => {
      mockFetchUserMfaMethods.mockResolvedValue({});
      await expect(guard.canActivate(makeCtx('user-nomfa'))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('fails closed when PropelAuth throws', async () => {
      mockFetchUserMfaMethods.mockRejectedValue(new Error('network'));
      await expect(guard.canActivate(makeCtx('user-fail'))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('uses cache on second call and does not re-fetch', async () => {
      mockFetchUserMfaMethods.mockResolvedValue({ totpEnabled: true });
      const userId = 'user-cached-' + Date.now();

      await guard.canActivate(makeCtx(userId));
      await guard.canActivate(makeCtx(userId));

      expect(mockFetchUserMfaMethods).toHaveBeenCalledTimes(1);
    });

    it('resolves userId from req.user.id when userId property is absent', async () => {
      mockFetchUserMfaMethods.mockResolvedValue({ totpEnabled: true });
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-id-field' } }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });
});
