import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWT } from 'google-auth-library';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { encrypt, decrypt } from 'src/helpers/crypto';
import { invalidateLicenseReports } from 'src/services/softwareLicense.service';

const CONFIG_KEY = 'google_config';
const SYNC_STATUS_KEY = 'google_sync_status';
const LICENSING_SCOPE = 'https://www.googleapis.com/auth/apps.licensing';

export type TrackedSku = { productId: string; skuId: string; displayName?: string };
export type GoogleWorkspaceConfig = { adminEmail: string; serviceAccountJson: string; skus: TrackedSku[] };
export type GoogleWorkspacePublicConfig = { adminEmail: string; hasServiceAccount: boolean; skus: TrackedSku[] };

type LicenseAssignmentListResponse = {
  items?: { userId: string }[];
  nextPageToken?: string;
};

export type SyncResult = {
  synced: number; created: number; skipped: number; lastSyncAt: string;
};

@Injectable()
export class GoogleWorkspaceService {
  private readonly logger = new Logger(GoogleWorkspaceService.name);

  constructor(
    @InjectRepository(AdminSettings) private readonly adminRepo: Repository<AdminSettings>,
    @InjectRepository(SoftwareLicense) private readonly licenseRepo: Repository<SoftwareLicense>,
  ) {}

  // ─── Config ──────────────────────────────────────────────────────────────

  async saveConfig(dto: { adminEmail: string; serviceAccountJson?: string; skus: TrackedSku[] }): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    const stored = {
      adminEmail: dto.adminEmail,
      serviceAccountJson: dto.serviceAccountJson
        ? encrypt(dto.serviceAccountJson)
        : (record?.value as any)?.serviceAccountJson ?? '',
      skus: dto.skus,
    };
    if (record) {
      record.value = stored;
      await this.adminRepo.save(record);
    } else {
      await this.adminRepo.save(this.adminRepo.create({ id: uuidv4(), key: CONFIG_KEY, value: stored }));
    }
  }

  async getPublicConfig(): Promise<GoogleWorkspacePublicConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    return {
      adminEmail: v.adminEmail ?? '',
      hasServiceAccount: !!v.serviceAccountJson,
      skus: v.skus ?? [],
    };
  }

  async deleteConfig(): Promise<void> {
    await this.adminRepo.delete({ key: CONFIG_KEY });
  }

  private async getConfig(): Promise<GoogleWorkspaceConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    let serviceAccountJson: string;
    try {
      serviceAccountJson = decrypt(v.serviceAccountJson);
    } catch {
      serviceAccountJson = v.serviceAccountJson;
    }
    return { adminEmail: v.adminEmail, serviceAccountJson, skus: v.skus ?? [] };
  }

  // ─── Auth client ────────────────────────────────────────────────────────

  private async getClient(): Promise<JWT> {
    const cfg = await this.getConfig();
    if (!cfg?.serviceAccountJson) throw new Error('Google Workspace not configured');

    let key: { client_email: string; private_key: string };
    try {
      key = JSON.parse(cfg.serviceAccountJson);
    } catch {
      throw new Error('Nieprawidłowy JSON konta serwisowego');
    }

    const client = new JWT({
      email: key.client_email,
      key: key.private_key,
      subject: cfg.adminEmail,
      scopes: [LICENSING_SCOPE],
    });
    await client.authorize();
    return client;
  }

  // ─── Test connection ──────────────────────────────────────────────────────

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const cfg = await this.getConfig();
      const client = await this.getClient();
      const firstSku = cfg?.skus?.[0];
      if (firstSku) {
        await client.request({
          url: `https://licensing.googleapis.com/apps/licensing/v1/product/${encodeURIComponent(firstSku.productId)}/sku/${encodeURIComponent(firstSku.skuId)}/users`,
          params: { maxResults: 1 },
        });
      }
      return { ok: true, message: `Połączono jako: ${cfg?.adminEmail}` };
    } catch (err: any) {
      return { ok: false, message: err.message ?? 'Connection failed' };
    }
  }

  // ─── License sync ─────────────────────────────────────────────────────────

  private async listAssignedUsers(client: JWT, productId: string, skuId: string): Promise<number> {
    let count = 0;
    let pageToken: string | undefined;
    do {
      const res = await client.request<LicenseAssignmentListResponse>({
        url: `https://licensing.googleapis.com/apps/licensing/v1/product/${encodeURIComponent(productId)}/sku/${encodeURIComponent(skuId)}/users`,
        params: { maxResults: 100, ...(pageToken ? { pageToken } : {}) },
      });
      count += res.data.items?.length ?? 0;
      pageToken = res.data.nextPageToken;
    } while (pageToken);
    return count;
  }

  /**
   * Pulls seat counts from the Enterprise License Manager API into
   * SoftwareLicense, one row per configured (productId, skuId). Google has
   * no aggregate "what does this tenant own" endpoint, so totalSeats stays
   * null (unlimited) -- only consumedSeats (assigned-user count) is known.
   * Tracks pooled seats only -- does not create SoftwareLicenseAssignment
   * rows, so it can't conflict with manually-assigned licenses.
   */
  async syncLicenses(): Promise<SyncResult> {
    const cfg = await this.getConfig();
    if (!cfg?.serviceAccountJson) throw new Error('Google Workspace not configured');
    if (!cfg.skus.length) throw new Error('Brak skonfigurowanych SKU do synchronizacji');

    const client = await this.getClient();

    let synced = 0, created = 0, skipped = 0;

    for (const sku of cfg.skus) {
      if (!sku.productId || !sku.skuId) { skipped++; continue; }

      const consumedSeats = await this.listAssignedUsers(client, sku.productId, sku.skuId);
      const externalId = `${sku.productId}:${sku.skuId}`;

      const existing = await this.licenseRepo.findOne({
        where: { source: LicenseSource.GOOGLE, externalId },
      });

      if (existing) {
        existing.name = sku.displayName ?? sku.skuId;
        existing.publisher = 'Google';
        existing.totalSeats = null;
        existing.consumedSeats = consumedSeats;
        existing.lastSyncedAt = new Date();
        await this.licenseRepo.save(existing);
        synced++;
      } else {
        const license = this.licenseRepo.create({
          id: uuidv4(),
          name: sku.displayName ?? sku.skuId,
          publisher: 'Google',
          licenseType: LicenseType.SUBSCRIPTION,
          totalSeats: null,
          consumedSeats,
          source: LicenseSource.GOOGLE,
          externalId,
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
}
