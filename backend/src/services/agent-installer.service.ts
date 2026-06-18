import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

export type AgentPlatform = 'windows' | 'macos';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'agent');

const PLATFORM_CONFIG: Record<AgentPlatform, { key: string; fileName: string; extension: string }> = {
  windows: { key: 'agent_installer_windows', fileName: 'InfraPilotAgentSetup.exe', extension: '.exe' },
  macos:   { key: 'agent_installer_macos',   fileName: 'InfraPilotAgentSetup.pkg', extension: '.pkg' },
};

export type AgentInstallerMeta = {
  originalName: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string | null;
};

@Injectable()
export class AgentInstallerService {
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

  async upload(
    file: any,
    platform: AgentPlatform,
    uploadedBy: string | null,
  ): Promise<AgentInstallerMeta> {
    if (!file) throw new BadRequestException('Brak pliku');
    const { extension, key } = PLATFORM_CONFIG[platform];
    if (!file.originalname?.toLowerCase().endsWith(extension)) {
      throw new BadRequestException(`Instalator agenta musi być plikiem ${extension}`);
    }

    fs.writeFileSync(this.filePath(platform), file.buffer);

    const meta: AgentInstallerMeta = {
      originalName: file.originalname,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
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
}
