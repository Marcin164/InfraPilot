import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { encrypt, decrypt } from 'src/helpers/crypto';
import { invalidateLicenseReports } from 'src/services/softwareLicense.service';

const CONFIG_KEY = 'github_config';
const SYNC_STATUS_KEY = 'github_sync_status';
const EXTERNAL_ID = 'enterprise-seats';

export type GithubConfig = { enterpriseSlug: string; token: string };
export type GithubPublicConfig = { enterpriseSlug: string; hasToken: boolean };

type ConsumedLicensesResponse = {
  total_seats_purchased: number;
  total_seats_consumed: number;
};

export type SyncResult = {
  synced: number; created: number; skipped: number; lastSyncAt: string;
};

@Injectable()
export class GithubEnterpriseService {
  private readonly logger = new Logger(GithubEnterpriseService.name);

  constructor(
    @InjectRepository(AdminSettings) private readonly adminRepo: Repository<AdminSettings>,
    @InjectRepository(SoftwareLicense) private readonly licenseRepo: Repository<SoftwareLicense>,
  ) {}

  // ─── Config ──────────────────────────────────────────────────────────────

  async saveConfig(dto: { enterpriseSlug: string; token?: string }): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    const stored = {
      enterpriseSlug: dto.enterpriseSlug,
      token: dto.token ? encrypt(dto.token) : (record?.value as any)?.token ?? '',
    };
    if (record) {
      record.value = stored;
      await this.adminRepo.save(record);
    } else {
      await this.adminRepo.save(this.adminRepo.create({ id: uuidv4(), key: CONFIG_KEY, value: stored }));
    }
  }

  async getPublicConfig(): Promise<GithubPublicConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    return { enterpriseSlug: v.enterpriseSlug ?? '', hasToken: !!v.token };
  }

  async deleteConfig(): Promise<void> {
    await this.adminRepo.delete({ key: CONFIG_KEY });
  }

  private async getConfig(): Promise<GithubConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    try {
      return { enterpriseSlug: v.enterpriseSlug, token: decrypt(v.token) };
    } catch {
      return { enterpriseSlug: v.enterpriseSlug, token: v.token };
    }
  }

  // ─── GitHub API ─────────────────────────────────────────────────────────

  private async getConsumedLicenses(cfg: GithubConfig): Promise<ConsumedLicensesResponse> {
    const res = await fetch(
      `https://api.github.com/enterprises/${encodeURIComponent(cfg.enterpriseSlug)}/consumed-licenses`,
      {
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text().catch(() => '')}`);
    return res.json() as Promise<ConsumedLicensesResponse>;
  }

  // ─── Test connection ──────────────────────────────────────────────────────

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const cfg = await this.getConfig();
      if (!cfg) throw new Error('GitHub Enterprise not configured');
      const data = await this.getConsumedLicenses(cfg);
      return { ok: true, message: `Połączono z: ${cfg.enterpriseSlug} (${data.total_seats_consumed}/${data.total_seats_purchased} miejsc)` };
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

  /**
   * Pulls the aggregate seat count from GitHub's consumed-licenses endpoint
   * into a single SoftwareLicense row. Tracks pooled seats only -- does not
   * create SoftwareLicenseAssignment rows.
   */
  async syncLicenses(): Promise<SyncResult> {
    const cfg = await this.getConfig();
    if (!cfg?.token) throw new Error('GitHub Enterprise not configured');

    const data = await this.getConsumedLicenses(cfg);

    const existing = await this.licenseRepo.findOne({
      where: { source: LicenseSource.GITHUB, externalId: EXTERNAL_ID },
    });

    let synced = 0, created = 0;

    if (existing) {
      existing.name = 'GitHub Enterprise';
      existing.publisher = 'GitHub';
      existing.totalSeats = data.total_seats_purchased;
      existing.consumedSeats = data.total_seats_consumed;
      existing.lastSyncedAt = new Date();
      await this.licenseRepo.save(existing);
      synced = 1;
    } else {
      const license = this.licenseRepo.create({
        id: uuidv4(),
        name: 'GitHub Enterprise',
        publisher: 'GitHub',
        licenseType: LicenseType.SUBSCRIPTION,
        totalSeats: data.total_seats_purchased,
        consumedSeats: data.total_seats_consumed,
        source: LicenseSource.GITHUB,
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
