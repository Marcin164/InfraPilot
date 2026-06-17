import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

const KEY = 'agent_installer';
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'agent');
const FILE_NAME = 'InfraPilotAgentSetup.exe';

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

  private get filePath(): string {
    return path.join(UPLOAD_DIR, FILE_NAME);
  }

  async getMeta(): Promise<AgentInstallerMeta | null> {
    if (!fs.existsSync(this.filePath)) return null;
    const record = await this.repo.findOne({ where: { key: KEY } });
    return (record?.value as AgentInstallerMeta) ?? null;
  }

  async getFileStream(): Promise<{ stream: fs.ReadStream; meta: AgentInstallerMeta }> {
    const meta = await this.getMeta();
    if (!meta) throw new NotFoundException('Instalator agenta nie został jeszcze wgrany.');
    return { stream: fs.createReadStream(this.filePath), meta };
  }

  async upload(file: any, uploadedBy: string | null): Promise<AgentInstallerMeta> {
    if (!file) throw new BadRequestException('Brak pliku');
    if (!file.originalname?.toLowerCase().endsWith('.exe')) {
      throw new BadRequestException('Instalator agenta musi być plikiem .exe');
    }

    fs.writeFileSync(this.filePath, file.buffer);

    const meta: AgentInstallerMeta = {
      originalName: file.originalname,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
    };

    const existing = await this.repo.findOne({ where: { key: KEY } });
    if (existing) {
      existing.value = meta;
      await this.repo.save(existing);
    } else {
      await this.repo.insert({ id: uuidv4(), key: KEY, value: meta as any });
    }
    return meta;
  }
}
