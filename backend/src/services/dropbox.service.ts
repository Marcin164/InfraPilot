import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { encrypt, decrypt } from 'src/helpers/crypto';
import { invalidateLicenseReports } from 'src/services/softwareLicense.service';

const CONFIG_KEY = 'dropbox_config';
const SYNC_STATUS_KEY = 'dropbox_sync_status';
const EXTERNAL_ID = 'provisioned-users';

export type DropboxConfig = { appKey: string; appSecret: string; refreshToken: string };
export type DropboxPublicConfig = { appKey: string; hasSecret: boolean; hasRefreshToken: boolean };

type DropboxMember = { profile: { status: { '.tag': string } } };
type MembersListResponse = { members: DropboxMember[]; has_more: boolean; cursor?: string };

export type SyncResult = {
  synced: number; created: number; skipped: number; lastSyncAt: string;
};

@Injectable()
export class DropboxService {
  private readonly logger = new Logger(DropboxService.name);

  constructor(
    @InjectRepository(AdminSettings) private readonly adminRepo: Repository<AdminSettings>,
    @InjectRepository(SoftwareLicense) private readonly licenseRepo: Repository<SoftwareLicense>,
  ) {}

  // ─── Config ──────────────────────────────────────────────────────────────

  async saveConfig(dto: { appKey: string; appSecret?: string; refreshToken?: string }): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    const existing = record?.value as any;
    const stored = {
      appKey: dto.appKey,
      appSecret: dto.appSecret ? encrypt(dto.appSecret) : existing?.appSecret ?? '',
      refreshToken: dto.refreshToken ? encrypt(dto.refreshToken) : existing?.refreshToken ?? '',
    };
    if (record) {
      record.value = stored;
      await this.adminRepo.save(record);
    } else {
      await this.adminRepo.save(this.adminRepo.create({ id: uuidv4(), key: CONFIG_KEY, value: stored }));
    }
  }

  async getPublicConfig(): Promise<DropboxPublicConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    return { appKey: v.appKey ?? '', hasSecret: !!v.appSecret, hasRefreshToken: !!v.refreshToken };
  }

  async deleteConfig(): Promise<void> {
    await this.adminRepo.delete({ key: CONFIG_KEY });
  }

  private async getConfig(): Promise<DropboxConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    const decryptSafe = (val: string) => {
      try { return decrypt(val); } catch { return val; }
    };
    return { appKey: v.appKey, appSecret: decryptSafe(v.appSecret), refreshToken: decryptSafe(v.refreshToken) };
  }

  // ─── OAuth token (refresh_token grant) ─────────────────────────────────────

  private async getToken(cfg: DropboxConfig): Promise<string> {
    const basic = Buffer.from(`${cfg.appKey}:${cfg.appSecret}`).toString('base64');
    const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: cfg.refreshToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error_description ?? (err as any).error ?? `Dropbox token request failed: ${res.status}`);
    }
    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  // ─── Test connection ──────────────────────────────────────────────────────

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const cfg = await this.getConfig();
      if (!cfg?.refreshToken) throw new Error('Dropbox not configured');
      const token = await this.getToken(cfg);
      const res = await fetch('https://api.dropboxapi.com/2/team/members/list_v2', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 1 }),
      });
      if (!res.ok) throw new Error(`Dropbox ${res.status}: ${await res.text().catch(() => '')}`);
      return { ok: true, message: 'Połączono z zespołem Dropbox' };
    } catch (err: any) {
      return { ok: false, message: err.message ?? 'Connection failed' };
    }
  }

  // ─── Sync status ─────────────────────────────────────────────────────────

  async getSyncStatus(): Promise<{ licensesLastSync: string | null }> {
    const record = await this.adminRepo.findOne({ where: { key: SYNC_STATUS_KEY } });
    if (!record?.value) return { licensesLastSync: null };
    const v = record.value as any;
    return { licensesLastSync: v.licensesLastSync ?? null };
  }

  private async updateSyncStatus(): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: SYNC_STATUS_KEY } });
    const now = new Date().toISOString();
    if (record) {
      record.value = { ...(record.value as any), licensesLastSync: now };
      await this.adminRepo.save(record);
    } else {
      await this.adminRepo.save(
        this.adminRepo.create({ id: uuidv4(), key: SYNC_STATUS_KEY, value: { licensesLastSync: now } })
      );
    }
  }

  // ─── License sync ─────────────────────────────────────────────────────────

  private async countProvisionedMembers(token: string): Promise<number> {
    let count = 0;
    let res = await fetch('https://api.dropboxapi.com/2/team/members/list_v2', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 1000 }),
    });
    if (!res.ok) throw new Error(`Dropbox ${res.status}: ${await res.text().catch(() => '')}`);
    let data = await res.json() as MembersListResponse;

    for (;;) {
      count += (data.members ?? []).filter((m) => m.profile?.status?.['.tag'] !== 'removed').length;
      if (!data.has_more || !data.cursor) break;

      res = await fetch('https://api.dropboxapi.com/2/team/members/list/continue_v2', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursor: data.cursor }),
      });
      if (!res.ok) throw new Error(`Dropbox ${res.status}: ${await res.text().catch(() => '')}`);
      data = await res.json() as MembersListResponse;
    }

    return count;
  }

  /**
   * Pulls the provisioned-member count into a single SoftwareLicense row.
   * Dropbox's aggregate license-count field isn't reliably documented, so we
   * count team members directly (active/invited/suspended all consume a
   * license per Dropbox's own model) -- same pooled-seats-only, no-total
   * tradeoff already accepted for Google Workspace and Zoom.
   */
  async syncLicenses(): Promise<SyncResult> {
    const cfg = await this.getConfig();
    if (!cfg?.refreshToken) throw new Error('Dropbox not configured');

    const token = await this.getToken(cfg);
    const consumedSeats = await this.countProvisionedMembers(token);

    const existing = await this.licenseRepo.findOne({
      where: { source: LicenseSource.DROPBOX, externalId: EXTERNAL_ID },
    });

    let synced = 0, created = 0;

    if (existing) {
      existing.name = 'Dropbox — Provisioned Users';
      existing.publisher = 'Dropbox';
      existing.totalSeats = null;
      existing.consumedSeats = consumedSeats;
      existing.lastSyncedAt = new Date();
      await this.licenseRepo.save(existing);
      synced = 1;
    } else {
      const license = this.licenseRepo.create({
        id: uuidv4(),
        name: 'Dropbox — Provisioned Users',
        publisher: 'Dropbox',
        licenseType: LicenseType.SUBSCRIPTION,
        totalSeats: null,
        consumedSeats,
        source: LicenseSource.DROPBOX,
        externalId: EXTERNAL_ID,
        lastSyncedAt: new Date(),
      });
      await this.licenseRepo.save(license);
      created = 1;
    }

    invalidateLicenseReports();
    await this.updateSyncStatus();
    const lastSyncAt = new Date().toISOString();
    return { synced, created, skipped: 0, lastSyncAt };
  }
}
