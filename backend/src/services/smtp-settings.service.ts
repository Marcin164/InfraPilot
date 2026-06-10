import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { encrypt, decrypt } from 'src/helpers/crypto';

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export type SmtpPublicConfig = Omit<SmtpConfig, 'pass'> & { hasPass: boolean };

const KEY = 'smtp_config';

@Injectable()
export class SmtpSettingsService {
  constructor(
    @InjectRepository(AdminSettings)
    private readonly repo: Repository<AdminSettings>,
  ) {}

  async getConfig(): Promise<SmtpConfig | null> {
    const record = await this.repo.findOne({ where: { key: KEY } });
    if (record?.value) {
      const v = record.value as any;
      try {
        return { ...v, pass: v.pass ? decrypt(v.pass) : '' };
      } catch {
        return v as SmtpConfig;
      }
    }
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    return {
      host,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.MAIL_FROM_ADDRESS ?? process.env.SMTP_USER ?? 'infrapilot@localhost',
    };
  }

  async getPublicConfig(): Promise<SmtpPublicConfig | null> {
    const cfg = await this.getConfig();
    if (!cfg) return null;
    const { pass, ...rest } = cfg;
    return { ...rest, hasPass: !!pass };
  }

  async saveConfig(config: SmtpConfig): Promise<void> {
    const toStore = { ...config, pass: config.pass ? encrypt(config.pass) : '' };
    const existing = await this.repo.findOne({ where: { key: KEY } });
    if (existing) {
      existing.value = toStore;
      await this.repo.save(existing);
    } else {
      await this.repo.insert({ id: uuidv4(), key: KEY, value: toStore as any });
    }
  }

  async deleteConfig(): Promise<void> {
    await this.repo.delete({ key: KEY });
  }

  async testConnection(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.user && config.pass
          ? { user: config.user, pass: config.pass }
          : undefined,
        tls: { rejectUnauthorized: false },
      });
      await transporter.verify();
      return { success: true, message: 'Połączenie z serwerem SMTP działa poprawnie' };
    } catch (err: any) {
      return { success: false, message: `Test nieudany: ${err.message}` };
    }
  }
}
