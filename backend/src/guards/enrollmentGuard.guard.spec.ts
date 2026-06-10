import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { EnrollmentGuard } from './enrollmentGuard.guard';
import { AgentTokenService } from 'src/services/agent-token.service';

const makeCtx = (token: string | undefined): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: token === undefined ? {} : { 'x-enrollment-token': token },
      }),
    }),
  } as unknown as ExecutionContext);

const VALID_TOKEN = 'supersecrettoken1234'; // ≥16 chars

const makeModule = (resolvedToken: string | null) =>
  Test.createTestingModule({
    providers: [
      EnrollmentGuard,
      {
        provide: AgentTokenService,
        useValue: { getToken: jest.fn().mockResolvedValue(resolvedToken) },
      },
    ],
  }).compile();

describe('EnrollmentGuard', () => {
  it('throws ServiceUnavailableException when token is unset', async () => {
    const module = await makeModule(null);
    const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
    await expect(guard.canActivate(makeCtx(VALID_TOKEN))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws ServiceUnavailableException when token is shorter than 16 chars', async () => {
    const module = await makeModule('short');
    const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
    await expect(guard.canActivate(makeCtx('short'))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws UnauthorizedException when X-Enrollment-Token header is missing', async () => {
    const module = await makeModule(VALID_TOKEN);
    const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
    await expect(guard.canActivate(makeCtx(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when token is wrong', async () => {
    const module = await makeModule(VALID_TOKEN);
    const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
    await expect(
      guard.canActivate(makeCtx('wrongtokenvalue!')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns true for the correct token', async () => {
    const module = await makeModule(VALID_TOKEN);
    const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
    await expect(guard.canActivate(makeCtx(VALID_TOKEN))).resolves.toBe(true);
  });

  it('rejects a token that is a prefix of the valid token (length mismatch)', async () => {
    const module = await makeModule(VALID_TOKEN);
    const guard = module.get<EnrollmentGuard>(EnrollmentGuard);
    await expect(
      guard.canActivate(makeCtx(VALID_TOKEN.slice(0, -1))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
