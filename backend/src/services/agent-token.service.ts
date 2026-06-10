import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

const KEY = 'agent_enrollment_token';

@Injectable()
export class AgentTokenService {
  constructor(
    @InjectRepository(AdminSettings)
    private readonly repo: Repository<AdminSettings>,
  ) {}

  async getToken(): Promise<string | null> {
    const record = await this.repo.findOne({ where: { key: KEY } });
    if (record?.value?.token) return record.value.token as string;
    return process.env.AGENT_ENROLLMENT_TOKEN ?? null;
  }

  async rotateToken(): Promise<string> {
    const newToken = randomBytes(32).toString('hex');
    const existing = await this.repo.findOne({ where: { key: KEY } });
    if (existing) {
      existing.value = { token: newToken };
      await this.repo.save(existing);
    } else {
      await this.repo.insert({ id: uuidv4(), key: KEY, value: { token: newToken } as any });
    }
    return newToken;
  }
}
