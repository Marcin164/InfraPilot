import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { SmtpSettingsService } from './smtp-settings.service';

export type OutgoingMail = {
  to: string;
  subject: string;
  body: string;
  category?: string;
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private fromAddress = 'infrapilot@localhost';

  constructor(private readonly smtpSettings: SmtpSettingsService) {}

  async onModuleInit() {
    try {
      await this.reinit();
    } catch (err) {
      this.logger.warn(`SMTP init failed, running in stub mode: ${(err as Error).message}`);
    }
  }

  async reinit(): Promise<void> {
    this.transporter = null;
    const config = await this.smtpSettings.getConfig();
    if (!config?.host) {
      this.logger.warn('SMTP not configured — mail will be logged only (stub mode)');
      return;
    }
    this.fromAddress = config.from || config.user || 'infrapilot@localhost';
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user && config.pass
        ? { user: config.user, pass: config.pass }
        : undefined,
      tls: { rejectUnauthorized: false },
    });
    this.logger.log(
      `SMTP configured: ${config.host}:${config.port} secure=${config.secure} user=${config.user || '(none)'}`,
    );
  }

  async send(mail: OutgoingMail): Promise<void> {
    if (!mail.to?.trim()) {
      this.logger.warn('Skipping mail — empty recipient');
      return;
    }

    if (!this.transporter) {
      this.logger.log(
        `[mail-stub] to=${mail.to} subject="${mail.subject}" category=${mail.category ?? '-'}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: mail.to,
        subject: mail.subject,
        text: mail.body,
        html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${mail.body}</pre>`,
      });
      this.logger.log(`Mail sent to ${mail.to} — "${mail.subject}"`);
    } catch (err) {
      this.logger.warn(`Mail send failed for ${mail.to}: ${(err as Error).message}`);
      throw err;
    }
  }

  async sendMany(mails: OutgoingMail[]): Promise<void> {
    await Promise.all(mails.map((m) => this.send(m)));
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }
}
