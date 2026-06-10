import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { AgentGuard } from './agentGuard.guard';
import { Devices } from 'src/entities/devices.entity';

// Pre-computed test secret
const PLAIN_SECRET = 'my-agent-plaintext-secret';
const SECRET_HASH = createHash('sha256').update(PLAIN_SECRET).digest('hex');

const validTimestamp = () => new Date().toISOString();
const validNonce = () => `nonce-${Date.now()}-${Math.random()}`;

const buildSignature = (
  secretHash: string,
  timestamp: string,
  nonce: string,
  body: string,
): string =>
  createHmac('sha256', secretHash)
    .update(`${timestamp}|${nonce}|${body}`)
    .digest('hex');

const makeDevice = (overrides: Partial<Devices> = {}): Devices =>
  ({
    id: 'device-1',
    apiSecretHash: SECRET_HASH,
    apiSecretHashPrev: null,
    apiSecretPrevValidUntil: null,
    ...overrides,
  } as Devices);

const makeCtx = (headers: Record<string, string | undefined>, body = '{}') =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers,
        body: JSON.parse(body),
        rawBody: undefined,
      }),
    }),
  } as unknown as ExecutionContext);

const makeValidCtx = (
  deviceId: string,
  secretHash: string,
  body = '{}',
  nonceOverride?: string,
): { ctx: ExecutionContext; timestamp: string; nonce: string } => {
  const timestamp = validTimestamp();
  const nonce = nonceOverride ?? validNonce();
  const signature = buildSignature(secretHash, timestamp, nonce, body);
  const ctx = makeCtx({
    'x-device-id': deviceId,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  }, body);
  return { ctx, timestamp, nonce };
};

describe('AgentGuard', () => {
  let guard: AgentGuard;
  let devicesRepo: jest.Mocked<any>;

  beforeEach(async () => {
    devicesRepo = {
      findOneBy: jest.fn().mockResolvedValue(makeDevice()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentGuard,
        { provide: getRepositoryToken(Devices), useValue: devicesRepo },
      ],
    }).compile();

    guard = module.get<AgentGuard>(AgentGuard);
  });

  it('throws UnauthorizedException when agent headers are missing', async () => {
    const ctx = makeCtx({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when timestamp is too old', async () => {
    const staleTs = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
    const nonce = validNonce();
    const signature = buildSignature(SECRET_HASH, staleTs, nonce, '{}');
    const ctx = makeCtx({
      'x-device-id': 'device-1',
      'x-timestamp': staleTs,
      'x-nonce': nonce,
      'x-signature': signature,
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when timestamp is in the far future', async () => {
    const futureTs = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const nonce = validNonce();
    const signature = buildSignature(SECRET_HASH, futureTs, nonce, '{}');
    const ctx = makeCtx({
      'x-device-id': 'device-1',
      'x-timestamp': futureTs,
      'x-nonce': nonce,
      'x-signature': signature,
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when device is not found', async () => {
    devicesRepo.findOneBy.mockResolvedValue(null);
    const { ctx } = makeValidCtx('device-missing', SECRET_HASH);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when device has no secret hash at all', async () => {
    devicesRepo.findOneBy.mockResolvedValue(
      makeDevice({ apiSecretHash: null as any, apiSecretHashPrev: null }),
    );
    const { ctx } = makeValidCtx('device-1', SECRET_HASH);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when signature is wrong', async () => {
    const timestamp = validTimestamp();
    const nonce = validNonce();
    const ctx = makeCtx({
      'x-device-id': 'device-1',
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': 'deadbeef',
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns true and attaches agentDevice for a valid request', async () => {
    const timestamp = validTimestamp();
    const nonce = validNonce();
    const signature = buildSignature(SECRET_HASH, timestamp, nonce, '{}');

    const rawReq: any = {
      headers: {
        'x-device-id': 'device-1',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': signature,
      },
      body: {},
      rawBody: undefined,
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => rawReq }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(rawReq.agentDevice).toBeDefined();
    expect(rawReq.agentDevice.id).toBe('device-1');
  });

  it('throws UnauthorizedException on nonce reuse', async () => {
    const sharedNonce = `fixed-nonce-${Date.now()}`;
    const { ctx: ctx1 } = makeValidCtx('device-1', SECRET_HASH, '{}', sharedNonce);

    await guard.canActivate(ctx1);

    // Second request with same nonce
    const timestamp2 = validTimestamp();
    const sig2 = buildSignature(SECRET_HASH, timestamp2, sharedNonce, '{}');
    const ctx2 = makeCtx({
      'x-device-id': 'device-1',
      'x-timestamp': timestamp2,
      'x-nonce': sharedNonce,
      'x-signature': sig2,
    });

    await expect(guard.canActivate(ctx2)).rejects.toThrow(UnauthorizedException);
  });

  it('accepts the previous secret while still within grace period', async () => {
    const prevSecret = 'old-secret';
    const prevSecretHash = createHash('sha256').update(prevSecret).digest('hex');
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);

    devicesRepo.findOneBy.mockResolvedValue(
      makeDevice({
        apiSecretHash: SECRET_HASH,
        apiSecretHashPrev: prevSecretHash,
        apiSecretPrevValidUntil: futureExpiry,
      }),
    );

    const timestamp = validTimestamp();
    const nonce = validNonce();
    const signature = buildSignature(prevSecretHash, timestamp, nonce, '{}');
    const ctx = makeCtx({
      'x-device-id': 'device-1',
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('rejects the previous secret after grace period has expired', async () => {
    const prevSecret = 'old-secret';
    const prevSecretHash = createHash('sha256').update(prevSecret).digest('hex');
    const pastExpiry = new Date(Date.now() - 1000);

    devicesRepo.findOneBy.mockResolvedValue(
      makeDevice({
        apiSecretHash: SECRET_HASH,
        apiSecretHashPrev: prevSecretHash,
        apiSecretPrevValidUntil: pastExpiry,
      }),
    );

    const timestamp = validTimestamp();
    const nonce = validNonce();
    const signature = buildSignature(prevSecretHash, timestamp, nonce, '{}');
    const ctx = makeCtx({
      'x-device-id': 'device-1',
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
