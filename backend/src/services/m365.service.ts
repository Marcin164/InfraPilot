import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { Users } from 'src/entities/users.entity';
import { Devices } from 'src/entities/devices.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { encrypt, decrypt } from 'src/helpers/crypto';

const CONFIG_KEY = 'm365_config';
const SYNC_STATUS_KEY = 'm365_sync_status';
const GRAPH = 'https://graph.microsoft.com/v1.0';

export type M365Config = { tenantId: string; clientId: string; clientSecret: string };
export type M365PublicConfig = Omit<M365Config, 'clientSecret'> & { hasSecret: boolean };

export type SubscribedSku = {
  id: string; skuId: string; skuPartNumber: string; capabilityStatus: string;
  consumedUnits: number; prepaidUnits: { enabled: number; warning: number; suspended: number };
};

export type M365User = {
  id: string; displayName: string; mail: string | null;
  userPrincipalName: string; assignedLicenses: { skuId: string }[];
};

export type SyncResult = {
  synced: number; created: number; skipped: number; lastSyncAt: string;
};

@Injectable()
export class M365Service {
  private readonly logger = new Logger(M365Service.name);

  constructor(
    @InjectRepository(AdminSettings) private readonly adminRepo: Repository<AdminSettings>,
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
    @InjectRepository(Devices) private readonly devicesRepo: Repository<Devices>,
  ) {}

  // ─── Config ──────────────────────────────────────────────────────────────

  async saveConfig(dto: M365Config): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    const stored = {
      tenantId: dto.tenantId,
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

  async getPublicConfig(): Promise<M365PublicConfig | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    return { tenantId: v.tenantId ?? '', clientId: v.clientId ?? '', hasSecret: !!v.clientSecret };
  }

  async deleteConfig(): Promise<void> {
    await this.adminRepo.delete({ key: CONFIG_KEY });
  }

  private async getConfig(): Promise<M365Config | null> {
    const record = await this.adminRepo.findOne({ where: { key: CONFIG_KEY } });
    if (!record?.value) return null;
    const v = record.value as any;
    try {
      return { tenantId: v.tenantId, clientId: v.clientId, clientSecret: decrypt(v.clientSecret) };
    } catch {
      return { tenantId: v.tenantId, clientId: v.clientId, clientSecret: v.clientSecret };
    }
  }

  // ─── OAuth token ─────────────────────────────────────────────────────────

  async getToken(): Promise<string> {
    const cfg = await this.getConfig();
    if (!cfg) throw new Error('M365 not configured');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    });

    const res = await fetch(
      `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error_description ?? `Token request failed: ${res.status}`);
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  // ─── Graph helpers ────────────────────────────────────────────────────────

  private async graphGet<T>(token: string, url: string): Promise<T[]> {
    const results: T[] = [];
    let next: string | undefined = url;
    while (next) {
      const res = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Graph ${res.status}: ${await res.text().catch(() => '')}`);
      const data = await res.json() as any;
      results.push(...(data.value ?? []));
      next = data['@odata.nextLink'];
    }
    return results;
  }

  // ─── Test connection ──────────────────────────────────────────────────────

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const token = await this.getToken();
      const res = await fetch(`${GRAPH}/organization`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Graph API returned ${res.status}`);
      const data = await res.json() as any;
      const org = data.value?.[0];
      return { ok: true, message: `Connected to: ${org?.displayName ?? 'Unknown organization'}` };
    } catch (err: any) {
      return { ok: false, message: err.message ?? 'Connection failed' };
    }
  }

  // ─── Subscribed SKUs ─────────────────────────────────────────────────────

  async getSubscribedSkus(): Promise<SubscribedSku[]> {
    const token = await this.getToken();
    return this.graphGet<SubscribedSku>(token, `${GRAPH}/subscribedSkus`);
  }

  // ─── Users with licenses ─────────────────────────────────────────────────

  async getUsersWithLicenses(): Promise<M365User[]> {
    const token = await this.getToken();
    return this.graphGet<M365User>(token,
      `${GRAPH}/users?$select=id,displayName,mail,userPrincipalName,assignedLicenses&$top=999`);
  }

  // ─── Assign / remove license ─────────────────────────────────────────────

  async assignLicense(m365UserId: string, skuId: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(`${GRAPH}/users/${m365UserId}/assignLicense`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ addLicenses: [{ skuId }], removeLicenses: [] }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error?.message ?? `Assign failed: ${res.status}`);
    }
  }

  async removeLicense(m365UserId: string, skuId: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(`${GRAPH}/users/${m365UserId}/assignLicense`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ addLicenses: [], removeLicenses: [skuId] }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error?.message ?? `Remove failed: ${res.status}`);
    }
  }

  // ─── Sync status ─────────────────────────────────────────────────────────

  async getSyncStatus(): Promise<{ usersLastSync: string | null; devicesLastSync: string | null }> {
    const record = await this.adminRepo.findOne({ where: { key: SYNC_STATUS_KEY } });
    if (!record?.value) return { usersLastSync: null, devicesLastSync: null };
    const v = record.value as any;
    return { usersLastSync: v.usersLastSync ?? null, devicesLastSync: v.devicesLastSync ?? null };
  }

  private async updateSyncStatus(field: 'usersLastSync' | 'devicesLastSync'): Promise<void> {
    let record = await this.adminRepo.findOne({ where: { key: SYNC_STATUS_KEY } });
    const now = new Date().toISOString();
    if (record) {
      record.value = { ...(record.value as any), [field]: now };
      await this.adminRepo.save(record);
    } else {
      await this.adminRepo.save(
        this.adminRepo.create({ id: uuidv4(), key: SYNC_STATUS_KEY, value: { [field]: now } })
      );
    }
  }

  // ─── User sync ────────────────────────────────────────────────────────────

  async syncUsers(): Promise<SyncResult> {
    const token = await this.getToken();

    // Fetch Entra users (with signInActivity — requires AuditLog.Read.All)
    const entraUsers = await this.graphGet<any>(token,
      `${GRAPH}/users?$select=id,displayName,givenName,surname,mail,userPrincipalName,accountEnabled,signInActivity,department,jobTitle,officeLocation,city,country,postalCode,streetAddress,mobilePhone&$top=999`
    );

    // Fetch MFA registration details (requires Reports.Read.All)
    let mfaMap: Map<string, boolean> = new Map();
    try {
      const mfaData = await this.graphGet<any>(token,
        `${GRAPH}/reports/credentialUserRegistrationDetails?$select=userPrincipalName,isMfaRegistered`
      );
      for (const m of mfaData) {
        if (m.userPrincipalName) mfaMap.set(m.userPrincipalName.toLowerCase(), m.isMfaRegistered ?? false);
      }
    } catch (err) {
      this.logger.warn('Could not fetch MFA status (requires Reports.Read.All):', (err as any).message);
    }

    let synced = 0, created = 0, skipped = 0;

    for (const eu of entraUsers) {
      const email = (eu.mail ?? eu.userPrincipalName ?? '').toLowerCase();
      if (!email) { skipped++; continue; }

      const lastSignIn = eu.signInActivity?.lastSignInDateTime
        ? new Date(eu.signInActivity.lastSignInDateTime)
        : null;
      const mfaEnabled = mfaMap.has(eu.userPrincipalName?.toLowerCase())
        ? mfaMap.get(eu.userPrincipalName.toLowerCase())!
        : null;

      const existing = await this.usersRepo.findOne({
        where: [{ email: ILike(email) }, { entraId: eu.id }],
      });

      if (existing) {
        existing.entraId = eu.id;
        existing.entraEnabled = eu.accountEnabled ?? null;
        existing.entraLastSignIn = lastSignIn;
        existing.entraMfaEnabled = mfaEnabled;
        // Enrich AD fields if they're blank
        if (!existing.name && eu.givenName) existing.name = eu.givenName;
        if (!existing.surname && eu.surname) existing.surname = eu.surname;
        if (!existing.department && eu.department) existing.department = eu.department;
        if (!existing.title && eu.jobTitle) existing.title = eu.jobTitle;
        if (!existing.city && eu.city) existing.city = eu.city;
        if (!existing.country && eu.country) existing.country = eu.country;
        await this.usersRepo.save(existing);
        synced++;
      } else {
        // Create new user from Entra
        const fullName = eu.displayName ?? '';
        const parts = fullName.split(' ');
        const newUser = this.usersRepo.create({
          id: uuidv4(),
          entraId: eu.id,
          email: eu.mail ?? eu.userPrincipalName,
          username: eu.userPrincipalName,
          name: eu.givenName ?? parts[0] ?? null,
          surname: eu.surname ?? (parts.slice(1).join(' ') || null),
          department: eu.department ?? null,
          title: eu.jobTitle ?? null,
          city: eu.city ?? null,
          country: eu.country ?? null,
          postalCode: eu.postalCode ?? null,
          streetAddress: eu.streetAddress ?? null,
          phone: eu.mobilePhone ?? null,
          distinguishedName: eu.userPrincipalName,
          entraEnabled: eu.accountEnabled ?? null,
          entraLastSignIn: lastSignIn,
          entraMfaEnabled: mfaEnabled,
        });
        await this.usersRepo.save(newUser);
        created++;
      }
    }

    await this.updateSyncStatus('usersLastSync');
    const lastSyncAt = new Date().toISOString();
    return { synced, created, skipped, lastSyncAt };
  }

  // ─── Device compliance sync ───────────────────────────────────────────────

  async syncDeviceCompliance(): Promise<{ synced: number; unmatched: number; lastSyncAt: string }> {
    const token = await this.getToken();

    const intuneDevices = await this.graphGet<any>(token,
      `${GRAPH}/deviceManagement/managedDevices?$select=id,deviceName,serialNumber,complianceState,lastSyncDateTime,operatingSystem,osVersion,userDisplayName,userPrincipalName&$top=999`
    );

    let synced = 0, unmatched = 0;

    for (const id of intuneDevices) {
      const serial = (id.serialNumber ?? '').trim();
      if (!serial || serial === 'unknown' || serial === 'Default string') { unmatched++; continue; }

      const device = await this.devicesRepo.findOne({
        where: { serialNumber: ILike(serial) },
      });

      if (device) {
        device.intuneDeviceId = id.id;
        device.intuneComplianceState = id.complianceState ?? null;
        device.intuneLastSyncAt = id.lastSyncDateTime ? new Date(id.lastSyncDateTime) : null;
        await this.devicesRepo.save(device);
        synced++;
      } else {
        unmatched++;
      }
    }

    await this.updateSyncStatus('devicesLastSync');
    const lastSyncAt = new Date().toISOString();
    return { synced, unmatched, lastSyncAt };
  }
}
