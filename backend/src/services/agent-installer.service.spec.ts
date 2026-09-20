import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { AgentInstallerService } from './agent-installer.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';

const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

describe('AgentInstallerService', () => {
  let service: AgentInstallerService;
  const ORIGINAL_ENV = { ...process.env };
  const ORIGINAL_FETCH = global.fetch;

  beforeEach(async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      insert: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentInstallerService,
        { provide: getRepositoryToken(AdminSettings), useValue: repo },
      ],
    }).compile();

    service = module.get<AgentInstallerService>(AgentInstallerService);
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    global.fetch = ORIGINAL_FETCH;
    jest.restoreAllMocks();
  });

  // ─────────────────────────────────────────
  // upload() platform gating -- windows/macos sync automatically from
  // GitHub Releases now, only linux still accepts a human upload (paired
  // .deb + GPG .sig).
  // ─────────────────────────────────────────

  describe('upload', () => {
    it('rejects windows -- synced automatically instead', async () => {
      await expect(
        service.upload({ originalname: 'x.exe', buffer: Buffer.from(''), size: 0 }, 'windows', null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.upload({ originalname: 'x.exe', buffer: Buffer.from(''), size: 0 }, 'windows', null),
      ).rejects.toThrow(/GitHub Releases/);
    });

    it('rejects macos -- synced automatically instead', async () => {
      await expect(
        service.upload({ originalname: 'x.pkg', buffer: Buffer.from(''), size: 0 }, 'macos', null),
      ).rejects.toThrow(/GitHub Releases/);
    });

    it('does not reject linux at the platform gate -- fails later, on missing file', async () => {
      // Passing no file proves the platform check let it through: it
      // reaches the (unrelated, pre-existing) "Brak pliku" validation
      // instead of the platform-gating error, without touching the
      // filesystem.
      await expect(service.upload(null, 'linux', null)).rejects.toThrow('Brak pliku');
    });
  });

  // ─────────────────────────────────────────
  // syncFromGitHubReleases() -- windows/macos auto-sync from a private
  // repo's latest release. The backend holds the token; the target host
  // never sees it (see agent-installer.service.ts for why).
  // ─────────────────────────────────────────

  describe('syncFromGitHubReleases', () => {
    it('is a no-op when the env vars are not configured', async () => {
      delete process.env.AGENT_INSTALLER_GITHUB_TOKEN;
      delete process.env.AGENT_INSTALLER_GITHUB_REPO;
      const fetchMock = jest.fn();
      global.fetch = fetchMock as any;

      const result = await service.syncFromGitHubReleases('windows');

      expect(result).toEqual({ updated: false });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('skips without downloading when the latest release is already synced', async () => {
      process.env.AGENT_INSTALLER_GITHUB_TOKEN = 'tok';
      process.env.AGENT_INSTALLER_GITHUB_REPO = 'org/repo';
      jest.spyOn(service, 'getMeta').mockResolvedValue({
        originalName: 'InfraPilotAgentSetup-1.0.0.exe',
        sizeBytes: 100,
        uploadedAt: '',
        uploadedBy: null,
        sha256: '',
        signature: null,
        releaseTag: 'v1.0.0',
      });
      const fetchMock = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          assets: [{ name: 'InfraPilotAgentSetup-1.0.0.exe', url: 'https://api.github.com/x/assets/1' }],
        }),
      });
      global.fetch = fetchMock as any;

      const result = await service.syncFromGitHubReleases('windows');

      expect(result).toEqual({ updated: false });
      expect(fetchMock).toHaveBeenCalledTimes(1); // never fetched the asset itself
    });

    it('downloads and persists a genuinely new release', async () => {
      process.env.AGENT_INSTALLER_GITHUB_TOKEN = 'tok';
      process.env.AGENT_INSTALLER_GITHUB_REPO = 'org/repo';
      jest.spyOn(service, 'getMeta').mockResolvedValue(null);
      const persistSpy = jest
        .spyOn(service as any, 'persistFile')
        .mockResolvedValue({} as any);
      const bigBuffer = Buffer.alloc(100 * 1024, 1);

      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            tag_name: 'v2.0.0',
            assets: [{ name: 'InfraPilotAgentSetup-2.0.0.exe', url: 'https://api.github.com/x/assets/2' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => toArrayBuffer(bigBuffer),
        });
      global.fetch = fetchMock as any;

      const result = await service.syncFromGitHubReleases('windows');

      expect(result).toEqual({ updated: true });
      expect(persistSpy).toHaveBeenCalledWith(
        expect.any(Buffer),
        'InfraPilotAgentSetup-2.0.0.exe',
        'windows',
        'github-releases-sync',
        { signature: null, releaseTag: 'v2.0.0' },
      );
    });

    it('refuses a suspiciously small download instead of persisting it', async () => {
      process.env.AGENT_INSTALLER_GITHUB_TOKEN = 'tok';
      process.env.AGENT_INSTALLER_GITHUB_REPO = 'org/repo';
      jest.spyOn(service, 'getMeta').mockResolvedValue(null);
      const tinyBuffer = Buffer.from('not a real installer');

      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            tag_name: 'v2.0.0',
            assets: [{ name: 'InfraPilotAgentSetup-2.0.0.exe', url: 'https://api.github.com/x/assets/2' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => toArrayBuffer(tinyBuffer),
        });
      global.fetch = fetchMock as any;

      await expect(service.syncFromGitHubReleases('windows')).rejects.toThrow(/refusing/);
    });

    it('returns updated:false when the release has no matching asset', async () => {
      process.env.AGENT_INSTALLER_GITHUB_TOKEN = 'tok';
      process.env.AGENT_INSTALLER_GITHUB_REPO = 'org/repo';
      jest.spyOn(service, 'getMeta').mockResolvedValue(null);
      const fetchMock = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v2.0.0',
          assets: [{ name: 'InfraPilotAgentSetup-2.0.0.pkg', url: 'x' }], // wrong extension for "windows"
        }),
      });
      global.fetch = fetchMock as any;

      const result = await service.syncFromGitHubReleases('windows');

      expect(result).toEqual({ updated: false });
    });
  });
});
