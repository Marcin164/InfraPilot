import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import {
  DeviceEnrollmentToken,
  DeviceEnrollmentTokenStatus,
} from 'src/entities/deviceEnrollmentToken.entity';

export type EnrollmentTokenListItem = {
  id: string;
  label: string | null;
  createdAt: Date;
  expiresAt: Date;
  displayStatus: 'pending' | 'used' | 'revoked' | 'expired';
  deviceId: string | null;
};

const MIN_TTL_HOURS = 1;
const MAX_TTL_HOURS = 24 * 90;
const DEFAULT_TTL_HOURS = 24 * 30;

function hash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class DeviceEnrollmentTokenService {
  constructor(
    @InjectRepository(DeviceEnrollmentToken)
    private readonly repo: Repository<DeviceEnrollmentToken>,
  ) {}

  async generate(
    label: string | null,
    ttlHours: number | undefined,
    createdBy: string | null,
  ): Promise<{ id: string; rawToken: string; expiresAt: Date }> {
    const clampedTtl = Math.min(
      MAX_TTL_HOURS,
      Math.max(MIN_TTL_HOURS, ttlHours ?? DEFAULT_TTL_HOURS),
    );
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + clampedTtl * 60 * 60 * 1000);

    const row = this.repo.create({
      tokenHash: hash(rawToken),
      label: label?.trim() || null,
      createdBy,
      expiresAt,
      status: DeviceEnrollmentTokenStatus.PENDING,
    });
    const saved = await this.repo.save(row);
    return { id: saved.id, rawToken, expiresAt };
  }

  async list(): Promise<EnrollmentTokenListItem[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    const now = Date.now();
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      deviceId: r.deviceId,
      displayStatus:
        r.status === DeviceEnrollmentTokenStatus.PENDING &&
        r.expiresAt.getTime() < now
          ? 'expired'
          : r.status,
    }));
  }

  async revoke(id: string): Promise<boolean> {
    const result = await this.repo.update(
      { id, status: DeviceEnrollmentTokenStatus.PENDING },
      { status: DeviceEnrollmentTokenStatus.REVOKED },
    );
    return (result.affected ?? 0) > 0;
  }

  /**
   * Atomically redeems a one-time token: flips pending -> used in a single
   * conditional UPDATE so two concurrent requests can't both succeed with
   * the same token. Returns the token's row id on success (used afterwards
   * to link the resulting device via `linkDevice`), or null if the token
   * doesn't exist, was already used/revoked, or has expired.
   */
  async validateAndConsume(rawToken: string): Promise<{ id: string } | null> {
    const tokenHash = hash(rawToken);
    const result = await this.repo
      .createQueryBuilder()
      .update(DeviceEnrollmentToken)
      .set({ status: DeviceEnrollmentTokenStatus.USED, usedAt: () => 'now()' })
      .where('"tokenHash" = :tokenHash', { tokenHash })
      .andWhere('status = :status', { status: DeviceEnrollmentTokenStatus.PENDING })
      .andWhere('"expiresAt" > :now', { now: new Date() })
      .returning(['id'])
      .execute();

    if (!result.affected) return null;
    return { id: result.raw[0].id };
  }

  async linkDevice(id: string, deviceId: string): Promise<void> {
    await this.repo.update({ id }, { deviceId });
  }
}
