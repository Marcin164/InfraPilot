import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_EVENTS,
  NotificationChannel,
  NotificationEvent,
  NotificationPreference,
} from 'src/entities/notificationPreference.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

/**
 * Defaults applied when no preference row exists for the (event, channel)
 * pair. In-app gets everything; email is sane subset; SMS is reserved
 * for high-urgency events that justify a phone buzz.
 */
const DEFAULTS: Record<NotificationChannel, Set<NotificationEvent>> = {
  inapp: new Set(NOTIFICATION_EVENTS),
  email: new Set([
    'ticket_assigned',
    'ticket_state_changed',
    'ticket_comment',
    'ticket_mention',
    'ticket_sla_breach',
    'ticket_auto_followup',
    'cve_critical',
    'compliance_failing',
    'device_down',
    'config_backup_failed',
    'ip_conflict_detected',
  ]),
  sms: new Set(['ticket_sla_breach', 'cve_critical', 'device_down', 'ip_conflict_detected']),
};

export type PreferenceRow = {
  event: NotificationEvent;
  channel: NotificationChannel;
  enabled: boolean;
};

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(NotificationPreference)
    private readonly repo: Repository<NotificationPreference>,
  ) {}

  async listForUser(userId: string): Promise<PreferenceRow[]> {
    const stored = await this.repo.find({ where: { userId } });
    const map = new Map<string, NotificationPreference>();
    for (const r of stored) map.set(`${r.event}:${r.channel}`, r);

    const out: PreferenceRow[] = [];
    for (const event of NOTIFICATION_EVENTS) {
      for (const channel of ['inapp', 'email', 'sms'] as NotificationChannel[]) {
        const row = map.get(`${event}:${channel}`);
        out.push({
          event,
          channel,
          enabled: row ? row.enabled : DEFAULTS[channel].has(event),
        });
      }
    }
    return out;
  }

  async isEnabled(
    userId: string,
    event: NotificationEvent,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const row = await this.repo.findOne({
      where: { userId, event, channel },
    });
    if (row) return row.enabled;
    return DEFAULTS[channel].has(event);
  }

  async setMany(
    userId: string,
    rows: PreferenceRow[],
  ): Promise<number> {
    let written = 0;
    for (const r of rows) {
      const existing = await this.repo.findOne({
        where: { userId, event: r.event, channel: r.channel },
      });
      if (existing) {
        if (existing.enabled !== r.enabled) {
          existing.enabled = r.enabled;
          await this.repo.save(existing);
          written += 1;
        }
        continue;
      }
      const row = new NotificationPreference();
      row.id = uuidv4();
      row.userId = userId;
      row.event = r.event;
      row.channel = r.channel;
      row.enabled = r.enabled;
      await this.repo.save(row);
      written += 1;
    }
    return written;
  }
}
