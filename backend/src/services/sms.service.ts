import { Injectable, Logger } from '@nestjs/common';

export type OutgoingSms = {
  to: string;
  body: string;
  category?: string;
};

/**
 * Pluggable SMS relay — same shape as MailService. POSTs each message to a
 * relay URL (Twilio webhook, vendor-specific gateway, internal service).
 * Without `SMS_RELAY_URL` configured, messages are logged but not sent —
 * dev/CI safe.
 *
 * SMS bodies are truncated to 480 chars (3 GSM segments) to avoid runaway
 * fees if a payload accidentally includes a stack trace.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly relayUrl = process.env.SMS_RELAY_URL ?? null;
  private readonly relayToken = process.env.SMS_RELAY_TOKEN ?? null;
  private readonly fromNumber = process.env.SMS_FROM_NUMBER ?? 'InfraPilot';

  async send(sms: OutgoingSms): Promise<void> {
    if (!sms.to?.trim()) {
      this.logger.warn('Skipping SMS — empty recipient');
      return;
    }

    const body = sms.body.slice(0, 480);

    if (!this.relayUrl) {
      this.logger.log(
        `[sms-stub] to=${sms.to} category=${sms.category ?? '-'} body="${body.slice(0, 60)}…"`,
      );
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.relayToken) {
        headers['Authorization'] = `Bearer ${this.relayToken}`;
      }
      const res = await fetch(this.relayUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from: this.fromNumber,
          to: sms.to,
          body,
          category: sms.category,
        }),
      });
      if (!res.ok) {
        this.logger.warn(
          `SMS relay returned ${res.status} for ${sms.to}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `SMS relay failed for ${sms.to}: ${(err as Error).message}`,
      );
    }
  }
}
