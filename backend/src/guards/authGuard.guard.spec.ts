import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './authGuard.guard';

jest.mock('src/helpers/propelAuthClient', () => ({
  validateAccessTokenAndGetUserClass: jest.fn(),
}));

import { validateAccessTokenAndGetUserClass } from 'src/helpers/propelAuthClient';

const buildContext = (headers: Record<string, string> = {}): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext);

describe('AuthGuard', () => {
  let guard: AuthGuard;
  const validateMock = validateAccessTokenAndGetUserClass as jest.MockedFunction<
    typeof validateAccessTokenAndGetUserClass
  >;

  beforeEach(() => {
    guard = new AuthGuard();
    jest.clearAllMocks();
  });

  it('throws UnauthorizedException when Authorization header is missing', async () => {
    const ctx = buildContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when header is not Bearer scheme', async () => {
    const ctx = buildContext({ authorization: 'Basic dXNlcjpwYXNz' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is missing after "Bearer "', async () => {
    const ctx = buildContext({ authorization: 'Bearer ' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when PropelAuth rejects the token', async () => {
    validateMock.mockRejectedValue(new Error('Token expired'));
    const ctx = buildContext({ authorization: 'Bearer bad-token' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches user to request and returns true for a valid token', async () => {
    const fakeUser = { userId: 'u1', email: 'agent@acme.com' };
    validateMock.mockResolvedValue(fakeUser as any);

    const req: any = { headers: { authorization: 'Bearer valid-token' } };
    const ctx: ExecutionContext = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req.user).toEqual(fakeUser);
    expect(validateMock).toHaveBeenCalledWith('valid-token');
  });
});
