import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

export type AgentPlatform = 'windows' | 'macos' | 'linux';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'agent');

const PLATFORM_CONFIG: Record<AgentPlatform, { key: string; fileName: string; extension: string }> = {
  windows: { key: 'agent_installer_windows', fileName: 'InfraPilotAgentSetup.exe', extension: '.exe' },
  macos:   { key: 'agent_installer_macos',   fileName: 'InfraPilotAgentSetup.pkg', extension: '.pkg' },
  linux:   { key: 'agent_installer_linux',   fileName: 'InfraPilotAgentSetup.deb', extension: '.deb' },
};

// Below this, a downloaded release asset is almost certainly a truncated
// transfer or an HTML error/login page, not a real installer -- refuse to
// overwrite a working file with it. Real installers are tens of MB.
const MIN_PLAUSIBLE_INSTALLER_BYTES = 64 * 1024;

export type AgentInstallerMeta = {
  originalName: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string | null;
  sha256: string;
  // Detached GPG signature (ASCII-armored), Linux only for now — see
  // linuxApp/installer/PACKAGE_SIGNING.md. Verified against the public key
  // baked into backend/src/config/packageSigningKey.ts before dpkg -i runs.
  signature: string | null;
  // GitHub release tag this file was auto-synced from (windows/macos) --
  // null for a human upload (Linux, or a pre-migration file). Lets
  // syncFromGitHubReleases() skip re-downloading an unchanged release.
  releaseTag: string | null;
};

@Injectable()
export class AgentInstallerService {
  private readonly logger = new Logger(AgentInstallerService.name);

  constructor(
    @InjectRepository(AdminSettings)
    private readonly repo: Repository<AdminSettings>,
  ) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  private filePath(platform: AgentPlatform): string {
    return path.join(UPLOAD_DIR, PLATFORM_CONFIG[platform].fileName);
  }

  async getMeta(platform: AgentPlatform): Promise<AgentInstallerMeta | null> {
    if (!fs.existsSync(this.filePath(platform))) return null;
    const record = await this.repo.findOne({ where: { key: PLATFORM_CONFIG[platform].key } });
    return (record?.value as AgentInstallerMeta) ?? null;
  }

  async getFileStream(
    platform: AgentPlatform,
  ): Promise<{ stream: fs.ReadStream; meta: AgentInstallerMeta }> {
    const meta = await this.getMeta(platform);
    if (!meta) throw new NotFoundException('Instalator agenta nie został jeszcze wgrany.');
    return { stream: fs.createReadStream(this.filePath(platform)), meta };
  }

  /** Human-driven upload, guarded at the controller by AuthGuard + permission.
   * Windows/macOS are synced automatically instead (syncFromGitHubReleases) --
   * a browser upload for those would just get overwritten by the next sync,
   * so it's refused outright rather than silently discarded later. */
  async upload(
    file: any,
    platform: AgentPlatform,
    uploadedBy: string | null,
    signatureFile?: any,
  ): Promise<AgentInstallerMeta> {
    if (platform !== 'linux') {
      throw new BadRequestException(
        `${platform} installers sync automatically from GitHub Releases now, not upload -- ` +
        `see AGENT_INSTALLER_GITHUB_TOKEN/_REPO, or use "Synchronizuj teraz" in Settings.`,
      );
    }
    if (!file) throw new BadRequestException('Brak pliku');
    const { extension } = PLATFORM_CONFIG[platform];
    if (!file.originalname?.toLowerCase().endsWith(extension)) {
      throw new BadRequestException(`Instalator agenta musi być plikiem ${extension}`);
    }

    let signature: string | null = null;
    if (signatureFile) {
      const text = signatureFile.buffer.toString('utf8');
      if (!text.includes('BEGIN PGP SIGNATURE')) {
        throw new BadRequestException('Plik podpisu musi być odłączonym podpisem GPG (.asc/.sig)');
      }
      signature = text;
    }

    return this.persistFile(file.buffer, file.originalname, platform, uploadedBy, {
      signature,
      releaseTag: null,
    });
  }

  /** Shared write path for both the (Linux-only) human upload and the
   * GitHub Releases sync -- extension check, hash, write to disk,
   * AdminSettings upsert. */
  private async persistFile(
    buffer: Buffer,
    originalName: string,
    platform: AgentPlatform,
    uploadedBy: string | null,
    extra: { signature: string | null; releaseTag: string | null },
  ): Promise<AgentInstallerMeta> {
    const { extension, key } = PLATFORM_CONFIG[platform];
    if (!originalName?.toLowerCase().endsWith(extension)) {
      throw new BadRequestException(`Instalator agenta musi być plikiem ${extension}`);
    }

    fs.writeFileSync(this.filePath(platform), buffer);

    const meta: AgentInstallerMeta = {
      originalName,
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      signature: extra.signature,
      releaseTag: extra.releaseTag,
    };

    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.value = meta;
      await this.repo.save(existing);
    } else {
      await this.repo.insert({ id: uuidv4(), key, value: meta as any });
    }
    return meta;
  }

  // ─── GitHub Releases sync (windows/macos) ──────────────────────────────

  /**
   * Pulls the newest release asset for `platform` from a private GitHub
   * repo and self-hosts it, exactly as if an admin had uploaded it --
   * without ever handing the target host (which runs the bare install
   * snippet, no credentials) anything to authenticate with. The backend
   * is the only thing that ever sees AGENT_INSTALLER_GITHUB_TOKEN.
   *
   * Opt-in: both env vars must be set, or this is a silent no-op (same
   * pattern as NetworkScanWorker skipping subnets with no candidate agent).
   */
  async syncFromGitHubReleases(platform: 'windows' | 'macos'): Promise<{ updated: boolean }> {
    const token = process.env.AGENT_INSTALLER_GITHUB_TOKEN?.trim();
    const repo = process.env.AGENT_INSTALLER_GITHUB_REPO?.trim();
    if (!token || !repo) return { updated: false };

    const extension = PLATFORM_CONFIG[platform].extension;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
    if (!releaseRes.ok) {
      throw new Error(`GitHub releases/latest ${releaseRes.status}: ${await releaseRes.text().catch(() => '')}`);
    }
    const release = (await releaseRes.json()) as {
      tag_name: string;
      assets: Array<{ name: string; url: string }>;
    };

    const asset = release.assets.find(
      (a) => a.name.startsWith('InfraPilotAgentSetup-') && a.name.toLowerCase().endsWith(extension),
    );
    if (!asset) {
      this.logger.warn(`No ${extension} asset on release ${release.tag_name} for ${platform}`);
      return { updated: false };
    }

    const current = await this.getMeta(platform);
    if (current?.releaseTag === release.tag_name) {
      return { updated: false }; // already synced this release
    }

    // The asset API url (not browser_download_url) is what triggers the
    // signed-redirect flow private-repo assets need. `Accept:
    // application/octet-stream` asks for the binary instead of asset
    // metadata JSON. fetch's default redirect:'follow' handles the hop
    // to blob storage -- per the Fetch spec, Authorization is dropped on
    // that cross-origin redirect automatically, which is exactly right
    // here (the signed redirect URL carries its own auth).
    const assetRes = await fetch(asset.url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/octet-stream' },
    });
    if (!assetRes.ok) {
      throw new Error(`GitHub asset download ${assetRes.status} for ${asset.name}`);
    }
    const buffer = Buffer.from(await assetRes.arrayBuffer());
    if (buffer.length < MIN_PLAUSIBLE_INSTALLER_BYTES) {
      throw new Error(
        `Downloaded ${asset.name} is only ${buffer.length} bytes -- refusing to treat as a real installer`,
      );
    }

    await this.persistFile(buffer, asset.name, platform, 'github-releases-sync', {
      signature: null,
      releaseTag: release.tag_name,
    });
    this.logger.log(`Synced ${platform} installer from release ${release.tag_name} (${asset.name})`);
    return { updated: true };
  }
}
