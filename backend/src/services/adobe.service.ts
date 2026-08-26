import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { encrypt, decrypt } from 'src/helpers/crypto';
import { invalidateLicenseReports } from 'src/services/softwareLicense.service';

const CONFIG_KEY = 'adobe_config';
const SYNC_STATUS_KEY = 'adobe_sync_status';
const UMAPI_SCOPE = 'openid,AdobeID,user_management_sdk';

export type TrackedProfile = { groupName: string; displayName?: string };
export type AdobeConfig = { orgId: string; clientId: string; clientSecret: string; profiles: TrackedProfile[] };
export type AdobePublicConfig = { orgId: string; clientId: string; hasSecret: boolean; profiles: TrackedProfile[] };

type UsersByGroupResponse = {
  lastPage?: boolean;
  users?: { email: string; status: string }[];
};

export type SyncResult = {
  synced: number; created: number; skipped: number; lastSyncAt: string;
};

@Injectable()
export class AdobeService {
  private readonly logger = new Logger(AdobeService.name);

  constructor(
    @InjectRepository(AdminSettings) private readonly adminRepo: Repository<AdminSettings>,
    @InjectRepository(SoftwareLicense) private readonly licenseRepo: Repository<SoftwareLicense>,
  ) {}

  // ─── Config ──────────────────────────────────────────────────────────────

  async saveConfig(dto: { orgId: string; clientId: string; clientSecret?: string; profiles: TrackedProfile[] }): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    const stored = {
      orgId: dto.orgId,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret ? encrypt(dto.clientSecret) : (record?.value as any)?.clientSecret ?? '',
      profiles: dto.profiles,
    };
    if (record) {
      record.value = stored;
      await this.adminRepo.save(record);
    } else {
      await this.adminRepo.save(this.adminRepo.create({ id: uuidv4(), key: CONFIG_KEY, value: stored }));
    }
  }

  async getPublicConfig(): Promise<AdobePublicConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    return { orgId: v.orgId ?? '', clientId: v.clientId ?? '', hasSecret: !!v.clientSecret, profiles: v.profiles ?? [] };
  }

  async deleteConfig(): Promise<void> {
    await this.adminRepo.delete({ key: CONFIG_KEY });
  }

  private async getConfig(): Promise<AdobeConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    try {
      return { orgId: v.orgId, clientId: v.clientId, clientSecret: decrypt(v.clientSecret), profiles: v.profiles ?? [] };
    } catch {
      return { orgId: v.orgId, clientId: v.clientId, clientSecret: v.clientSecret, profiles: v.profiles ?? [] };
    }
  }

  // ─── OAuth token (Server-to-Server, client_credentials grant) ─────────────

  private async getToken(cfg: AdobeConfig): Promise<string> {
    const res = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        scope: UMAPI_SCOPE,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error_description ?? (err as any).error ?? `Adobe token request failed: ${res.status}`);
    }
    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  private async getUsersPage(token: string, clientId: string, orgId: string, groupName: string, page: number): Promise<UsersByGroupResponse> {
    const url = `https://usermanagement.adobe.io/v2/usermanagement/users/${encodeURIComponent(orgId)}/${page}/${encodeURIComponent(groupName)}?status=active`;
    // UMAPI (like most Adobe I/O APIs) requires x-api-key alongside the bearer token.
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'x-api-key': clientId } });
    if (!res.ok) throw new Error(`Adobe ${res.status}: ${await res.text().catch(() => '')}`);
    return res.json() as Promise<UsersByGroupResponse>;
  }

  // ─── Test connection ──────────────────────────────────────────────────────

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const cfg = await this.getConfig();
      if (!cfg?.clientSecret) throw new Error('Adobe not configured');
      const token = await this.getToken(cfg);
      const firstProfile = cfg.profiles[0];
      if (firstProfile) {
        await this.getUsersPage(token, cfg.clientId, cfg.orgId, firstProfile.groupName, 0);
      }
      return { ok: true, message: `Połączono z organizacją: ${cfg.orgId}` };
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

  private async countProfileUsers(token: string, clientId: string, orgId: string, groupName: string): Promise<number> {
    let count = 0;
    let page = 0;
    for (;;) {
      const data = await this.getUsersPage(token, clientId, orgId, groupName, page);
      count += data.users?.length ?? 0;
      if (data.lastPage !== false) break;
      page++;
    }
    return count;
  }

  /**
   * Pulls the assigned-user count per tracked Product Profile into one
   * SoftwareLicense row each. Adobe has no aggregate "seats purchased"
   * endpoint, so totalSeats stays null -- same pooled-seats-only tradeoff
   * already accepted for Google Workspace, Zoom and Dropbox.
   */
  async syncLicenses(): Promise<SyncResult> {
    const cfg = await this.getConfig();
    if (!cfg?.clientSecret) throw new Error('Adobe not configured');
    if (!cfg.profiles.length) throw new Error('Brak skonfigurowanych Product Profiles do synchronizacji');

    const token = await this.getToken(cfg);

    let synced = 0, created = 0, skipped = 0;

    for (const profile of cfg.profiles) {
      if (!profile.groupName) { skipped++; continue; }

      const consumedSeats = await this.countProfileUsers(token, cfg.clientId, cfg.orgId, profile.groupName);

      const existing = await this.licenseRepo.findOne({
        where: { source: LicenseSource.ADOBE, externalId: profile.groupName },
      });

      if (existing) {
        existing.name = profile.displayName ?? profile.groupName;
        existing.publisher = 'Adobe';
        existing.totalSeats = null;
        existing.consumedSeats = consumedSeats;
        existing.lastSyncedAt = new Date();
        await this.licenseRepo.save(existing);
        synced++;
      } else {
        const license = this.licenseRepo.create({
          id: uuidv4(),
          name: profile.displayName ?? profile.groupName,
          publisher: 'Adobe',
          licenseType: LicenseType.SUBSCRIPTION,
          totalSeats: null,
          consumedSeats,
          source: LicenseSource.ADOBE,
          externalId: profile.groupName,
          lastSyncedAt: new Date(),
        });
        await this.licenseRepo.save(license);
        created++;
      }
    }

    invalidateLicenseReports();
    await this.updateSyncStatus();
    const lastSyncAt = new Date().toISOString();
    return { synced, created, skipped, lastSyncAt };
  }
}
