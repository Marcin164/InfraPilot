import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { encrypt, decrypt } from 'src/helpers/crypto';
import { invalidateLicenseReports } from 'src/services/softwareLicense.service';

const CONFIG_KEY = 'zoom_config';
const SYNC_STATUS_KEY = 'zoom_sync_status';
const EXTERNAL_ID = 'licensed-users';
const LICENSED_TYPE = 2; // Zoom user "type": 1 = Basic, 2 = Licensed, 3 = On-Prem

export type ZoomConfig = { accountId: string; clientId: string; clientSecret: string };
export type ZoomPublicConfig = { accountId: string; clientId: string; hasSecret: boolean };

type ZoomUser = { id: string; type: number };
type ZoomUsersResponse = { users: ZoomUser[]; next_page_token?: string };

export type SyncResult = {
  synced: number; created: number; skipped: number; lastSyncAt: string;
};

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  constructor(
    @InjectRepository(AdminSettings) private readonly adminRepo: Repository<AdminSettings>,
    @InjectRepository(SoftwareLicense) private readonly licenseRepo: Repository<SoftwareLicense>,
  ) {}

  // ─── Config ──────────────────────────────────────────────────────────────

  async saveConfig(dto: { accountId: string; clientId: string; clientSecret?: string }): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    const stored = {
      accountId: dto.accountId,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret ? encrypt(dto.clientSecret) : (record?.value as any)?.clientSecret ?? '',
    };
    if (record) {
      record.value = stored;
      await this.adminRepo.save(record);
    } else {
      await this.adminRepo.save(this.adminRepo.create({ id: uuidv4(), key: CONFIG_KEY, value: stored }));
    }
  }

  async getPublicConfig(): Promise<ZoomPublicConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    return { accountId: v.accountId ?? '', clientId: v.clientId ?? '', hasSecret: !!v.clientSecret };
  }

  async deleteConfig(): Promise<void> {
    await this.adminRepo.delete({ key: CONFIG_KEY });
  }

  private async getConfig(): Promise<ZoomConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    try {
      return { accountId: v.accountId, clientId: v.clientId, clientSecret: decrypt(v.clientSecret) };
    } catch {
      return { accountId: v.accountId, clientId: v.clientId, clientSecret: v.clientSecret };
    }
  }

  // ─── OAuth token (Server-to-Server, account_credentials grant) ────────────

  private async getToken(cfg: ZoomConfig): Promise<string> {
    const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(cfg.accountId)}`,
      { method: 'POST', headers: { Authorization: `Basic ${basic}` } },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).reason ?? (err as any).error ?? `Zoom token request failed: ${res.status}`);
    }
    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  // ─── Test connection ──────────────────────────────────────────────────────

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const cfg = await this.getConfig();
      if (!cfg) throw new Error('Zoom not configured');
      const token = await this.getToken(cfg);
      const res = await fetch('https://api.zoom.us/v2/users?status=active&page_size=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Zoom ${res.status}: ${await res.text().catch(() => '')}`);
      return { ok: true, message: `Połączono z kontem: ${cfg.accountId}` };
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

  private async countLicensedUsers(token: string): Promise<number> {
    let count = 0;
    let pageToken: string | undefined;
    do {
      const url = new URL('https://api.zoom.us/v2/users');
      url.searchParams.set('status', 'active');
      url.searchParams.set('page_size', '300');
      if (pageToken) url.searchParams.set('next_page_token', pageToken);

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Zoom ${res.status}: ${await res.text().catch(() => '')}`);
      const data = await res.json() as ZoomUsersResponse;
      count += (data.users ?? []).filter((u) => u.type === LICENSED_TYPE).length;
      pageToken = data.next_page_token || undefined;
    } while (pageToken);
    return count;
  }

  /**
   * Pulls the licensed-user count into a single SoftwareLicense row. Zoom
   * has no aggregate "seats purchased" endpoint and no SKU/plan concept in
   * this API, so totalSeats stays null. Tracks pooled seats only -- does
   * not create SoftwareLicenseAssignment rows.
   */
  async syncLicenses(): Promise<SyncResult> {
    const cfg = await this.getConfig();
    if (!cfg?.clientSecret) throw new Error('Zoom not configured');

    const token = await this.getToken(cfg);
    const consumedSeats = await this.countLicensedUsers(token);

    const existing = await this.licenseRepo.findOne({
      where: { source: LicenseSource.ZOOM, externalId: EXTERNAL_ID },
    });

    let synced = 0, created = 0;

    if (existing) {
      existing.name = 'Zoom — Licensed Users';
      existing.publisher = 'Zoom';
      existing.totalSeats = null;
      existing.consumedSeats = consumedSeats;
      existing.lastSyncedAt = new Date();
      await this.licenseRepo.save(existing);
      synced = 1;
    } else {
      const license = this.licenseRepo.create({
        id: uuidv4(),
        name: 'Zoom — Licensed Users',
        publisher: 'Zoom',
        licenseType: LicenseType.SUBSCRIPTION,
        totalSeats: null,
        consumedSeats,
        source: LicenseSource.ZOOM,
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
