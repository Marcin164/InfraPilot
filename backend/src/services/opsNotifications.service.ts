import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import {
  NotificationEvent,
  OPS_ROUTED_EVENTS,
} from 'src/entities/notificationPreference.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

const KEY = 'ops_notification_config';

export type OpsEventChannels = { inapp: boolean; email: boolean };

export type OpsNotificationConfig = {
  emails: string[];
  channels: Record<NotificationEvent, OpsEventChannels>;
};

const DEFAULT_CHANNELS: OpsEventChannels = { inapp: true, email: true };

/**
 * Global (not per-user) configuration for infra/ops alerts (device down,
 * backup failed, IP conflict, expiring license/warranty, etc.): which
 * channels are on for each event, and which fixed email address(es) receive
 * the email channel. Admin-only, editable in Settings > Notifications.
 */
@Injectable()
export class OpsNotificationsService {
  constructor(
    @InjectRepository(AdminSettings)
    private readonly repo: Repository<AdminSettings>,
  ) {}

  async getConfig(): Promise<OpsNotificationConfig> {
    const record = await this.repo.findOne({ where: { key: KEY } });
    const value = (record?.value as Partial<OpsNotificationConfig>) ?? {};

    const emails = Array.isArray(value.emails)
      ? value.emails.filter((e) => typeof e === 'string' && e.trim())
      : [];

    const channels = {} as Record<NotificationEvent, OpsEventChannels>;
    for (const event of OPS_ROUTED_EVENTS) {
      const stored = value.channels?.[event];
      channels[event] = {
        inapp: stored?.inapp ?? DEFAULT_CHANNELS.inapp,
        email: stored?.email ?? DEFAULT_CHANNELS.email,
      };
    }

    return { emails, channels };
  }

  async getChannelsForEvent(event: NotificationEvent): Promise<OpsEventChannels> {
    const config = await this.getConfig();
    return config.channels[event] ?? DEFAULT_CHANNELS;
  }

  async saveConfig(input: {
    emails: string[];
    channels: Record<string, Partial<OpsEventChannels>>;
  }): Promise<void> {
    const emails = Array.from(
      new Set(input.emails.map((e) => e.trim()).filter(Boolean)),
    );

    const channels = {} as Record<NotificationEvent, OpsEventChannels>;
    for (const event of OPS_ROUTED_EVENTS) {
      const stored = input.channels?.[event];
      channels[event] = {
        inapp: stored?.inapp ?? DEFAULT_CHANNELS.inapp,
        email: stored?.email ?? DEFAULT_CHANNELS.email,
      };
    }

    const value: OpsNotificationConfig = { emails, channels };
    const existing = await this.repo.findOne({ where: { key: KEY } });
    if (existing) {
      existing.value = value;
      await this.repo.save(existing);
    } else {
      await this.repo.insert({ id: uuidv4(), key: KEY, value: value as any });
    }
  }
}
