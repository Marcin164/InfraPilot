import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { EnrollmentGuard } from './enrollmentGuard.guard';
import { AgentTokenService } from 'src/services/agent-token.service';
import { DeviceEnrollmentTokenService } from 'src/services/deviceEnrollmentToken.service';

const makeCtx = (token: string | undefined): { ctx: ExecutionContext; req: any } => {
  const req: any = {
    headers: token === undefined ? {} : { 'x-enrollment-token': token },
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { ctx, req };
};

const VALID_TOKEN = 'supersecrettoken1234'; // ≥16 chars

// `perDeviceMatch` simulates DeviceEnrollmentTokenService.validateAndConsume:
// null means "no per-device token matched" (falls through to the legacy
// shared-token check below), an object means "matched and consumed".
const makeModule = (
  resolvedLegacyToken: string | null,
  perDeviceMatch: { id: string } | null = null,
) =>
  Test.createTestingModule({
    providers: [
      EnrollmentGuard,
      {
        provide: AgentTokenService,
        useValue: { getToken: jest.fn().mockResolvedValue(resolvedLegacyToken) },
      },
      {
        provide: DeviceEnrollmentTokenService,
        useValue: { validateAndConsume: jest.fn().mockResolvedValue(perDeviceMatch) },
      },
    ],
  }).compile();

describe('EnrollmentGuard', () => {
  describe('legacy shared-token fallback (no per-device token matches)', () => {
    it('throws UnauthorizedException when no per-device token matches and the legacy token is unset', async () => {
      const module = await makeModule(null);
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx } = makeCtx(VALID_TOKEN);
      await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the legacy token is shorter than 16 chars', async () => {
      const module = await makeModule('short');
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx } = makeCtx('short');
      await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when X-Enrollment-Token header is missing', async () => {
      const module = await makeModule(VALID_TOKEN);
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx } = makeCtx(undefined);
      await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the token matches neither per-device nor legacy', async () => {
      const module = await makeModule(VALID_TOKEN);
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx } = makeCtx('wrongtokenvalue!');
      await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns true for the correct legacy token', async () => {
      const module = await makeModule(VALID_TOKEN);
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx } = makeCtx(VALID_TOKEN);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('rejects a token that is a prefix of the valid legacy token (length mismatch)', async () => {
      const module = await makeModule(VALID_TOKEN);
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx } = makeCtx(VALID_TOKEN.slice(0, -1));
      await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('per-device token (preferred path)', () => {
    it('returns true and stamps req.enrollmentTokenId when a per-device token matches', async () => {
      const module = await makeModule(null, { id: 'token-row-1' });
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx, req } = makeCtx('per-device-raw-token');
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(req.enrollmentTokenId).toBe('token-row-1');
    });

    it('never touches the legacy token when a per-device token already matched', async () => {
      const module = await makeModule(VALID_TOKEN, { id: 'token-row-2' });
      const agentTokenService = module.get<AgentTokenService>(AgentTokenService);
      const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
      const { ctx } = makeCtx('per-device-raw-token');
      await guard.canActivate(ctx);
      expect(agentTokenService.getToken).not.toHaveBeenCalled();
    });
  });
});
