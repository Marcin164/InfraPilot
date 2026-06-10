import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { UserSettings } from 'src/entities/userSettings.entity';
import { NotificationEvent } from 'src/entities/notificationPreference.entity';
import { NotificationService } from './notification.service';
import { NotificationPreferencesService } from './notificationPreferences.service';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';

export type DispatchInput = {
  recipientIds: string[];
  event: NotificationEvent;
  title: string;
  body: string;
  url?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  smsBody?: string | null;
};

export type TestResult = {
  inapp: boolean;
  email: boolean;
  emailAddress: string | null;
  sms: boolean;
  phone: string | null;
};

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    @InjectRepository(UserSettings)
    private readonly settings: Repository<UserSettings>,
    private readonly inApp: NotificationService,
    private readonly prefs: NotificationPreferencesService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
  ) {}

  /** Resolve the effective notification email for a user.
   *  notifEmail from UserSettings takes precedence over Users.email. */
  private async resolveEmail(userId: string, adEmail: string | null): Promise<string | null> {
    const s = await this.settings.findOne({ where: { userId } });
    return s?.notifEmail?.trim() || adEmail || null;
  }

  /** Resolve the effective notification phone for a user. */
  private async resolvePhone(userId: string, adPhone: string | null): Promise<string | null> {
    const s = await this.settings.findOne({ where: { userId } });
    return s?.notifPhone?.trim() || adPhone || null;
  }

  async dispatch(input: DispatchInput): Promise<void> {
    const recipients = Array.from(new Set(input.recipientIds.filter(Boolean)));
    if (recipients.length === 0) return;

    const userList = await this.users.find({ where: { id: In(recipients) } });
    const byId = new Map<string, Users>();
    for (const u of userList) byId.set(u.id, u);

    for (const userId of recipients) {
      const u = byId.get(userId);
      if (!u) continue;

      try {
        if (await this.prefs.isEnabled(userId, input.event, 'inapp')) {
          await this.inApp.create({
            recipientId: userId,
            type: this.mapToInAppType(input.event),
            title: input.title,
            body: input.body,
            url: input.url ?? null,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            actorId: input.actorId ?? null,
          });
        }
      } catch (err) {
        this.logger.warn(`In-app dispatch failed for ${userId}: ${(err as Error).message}`);
      }

      try {
        const emailTo = await this.resolveEmail(userId, u.email ?? null);
        if (emailTo && (await this.prefs.isEnabled(userId, input.event, 'email'))) {
          await this.mail.send({
            to: emailTo,
            subject: input.title,
            body: input.body,
            category: input.event,
          });
        }
      } catch (err) {
        this.logger.warn(`Email dispatch failed for ${userId}: ${(err as Error).message}`);
      }

      try {
        const phoneTo = await this.resolvePhone(userId, u.phone ?? null);
        if (phoneTo && (await this.prefs.isEnabled(userId, input.event, 'sms'))) {
          await this.sms.send({
            to: phoneTo,
            body: input.smsBody ?? `${input.title}\n${input.body}`,
            category: input.event,
          });
        }
      } catch (err) {
        this.logger.warn(`SMS dispatch failed for ${userId}: ${(err as Error).message}`);
      }
    }
  }

  async test(userId: string): Promise<TestResult> {
    const userSettings = await this.settings.findOne({ where: { userId } });
    const userRecord = await this.users.findOne({ where: { id: userId } });

    const emailTo = userSettings?.notifEmail?.trim() || userRecord?.email || null;
    const phoneTo = userSettings?.notifPhone?.trim() || userRecord?.phone || null;

    const result: TestResult = { inapp: false, email: false, emailAddress: emailTo, sms: false, phone: phoneTo };

    try {
      await this.inApp.create({
        recipientId: userId,
        type: 'system',
        title: 'Test notification',
        body: 'This is a test notification from InfraPilot.',
        url: '/admin/settings/notifications',
        entityType: null,
        entityId: null,
        actorId: null,
      });
      result.inapp = true;
    } catch (err) {
      this.logger.warn(`Test in-app failed for ${userId}: ${(err as Error).message}`);
    }

    if (emailTo) {
      try {
        await this.mail.send({
          to: emailTo,
          subject: 'InfraPilot — test notification',
          body: 'This is a test notification. Your email channel is configured correctly.',
          category: 'test',
        });
        result.email = true;
      } catch (err) {
        this.logger.warn(`Test email failed for ${userId}: ${(err as Error).message}`);
      }
    }

    if (phoneTo) {
      try {
        await this.sms.send({
          to: phoneTo,
          body: 'InfraPilot test: SMS channel is configured correctly.',
          category: 'test',
        });
        result.sms = true;
      } catch (err) {
        this.logger.warn(`Test SMS failed for ${userId}: ${(err as Error).message}`);
      }
    }

    return result;
  }

  private mapToInAppType(
    event: NotificationEvent,
  ): 'mention' | 'assignment' | 'sla_breach' | 'auto_followup' | 'cve_critical' | 'system' {
    switch (event) {
      case 'ticket_mention': return 'mention';
      case 'ticket_assigned': return 'assignment';
      case 'ticket_sla_breach': return 'sla_breach';
      case 'ticket_auto_followup': return 'auto_followup';
      case 'cve_critical': return 'cve_critical';
      default: return 'system';
    }
  }
}
