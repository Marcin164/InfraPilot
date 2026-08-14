import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Users } from 'src/entities/users.entity';
import { NotificationEvent } from 'src/entities/notificationPreference.entity';
import { NotificationService } from './notification.service';
import { NotificationPreferencesService } from './notificationPreferences.service';
import { MailService } from './mail.service';
import { OpsNotificationsService } from './opsNotifications.service';

export type DispatchInput = {
  recipientIds: string[];
  event: NotificationEvent;
  title: string;
  body: string;
  url?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
};

export type OpsDispatchInput = {
  event: NotificationEvent;
  title: string;
  body: string;
};

export type TestResult = {
  inapp: boolean;
  email: boolean;
  emailAddress: string | null;
};

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly inApp: NotificationService,
    private readonly prefs: NotificationPreferencesService,
    private readonly mail: MailService,
    private readonly opsNotifications: OpsNotificationsService,
  ) {}

  /**
   * Infra/ops alerts (device down, backup failed, IP conflict, etc.) aren't
   * addressed to a user -- fan out to admins in-app and/or email the fixed
   * ops address(es), per the global per-event channel toggles in
   * OpsNotificationsService, instead of going through the per-user
   * preference matrix.
   */
  async dispatchOpsAlert(input: OpsDispatchInput): Promise<void> {
    const channels = await this.opsNotifications.getChannelsForEvent(input.event);

    if (channels.inapp) {
      const adminIds = await this.getAdminIds();
      for (const adminId of adminIds) {
        try {
          await this.inApp.create({
            recipientId: adminId,
            type: this.mapToInAppType(input.event),
            title: input.title,
            body: input.body,
            url: null,
            entityType: null,
            entityId: null,
            actorId: null,
          });
        } catch (err) {
          this.logger.warn(
            `Ops in-app dispatch failed for ${adminId}: ${(err as Error).message}`,
          );
        }
      }
    }

    if (channels.email) {
      const { emails } = await this.opsNotifications.getConfig();
      for (const to of emails) {
        try {
          await this.mail.send({
            to,
            subject: input.title,
            body: input.body,
            category: input.event,
          });
        } catch (err) {
          this.logger.warn(
            `Ops email dispatch failed for ${to}: ${(err as Error).message}`,
          );
        }
      }
    }
  }

  private async getAdminIds(): Promise<string[]> {
    const admins = await this.users
      .createQueryBuilder('u')
      .select('u.id')
      .where('u.isAdmin = true')
      .andWhere('u.erasedAt IS NULL')
      .getMany();
    return admins.map((u) => u.id);
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
        // Notification email is always the account's own login/directory
        // email -- no separate per-user override anymore.
        const emailTo = u.email ?? null;
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
    }
  }

  async test(userId: string): Promise<TestResult> {
    const userRecord = await this.users.findOne({ where: { id: userId } });
    const emailTo = userRecord?.email || null;

    const result: TestResult = { inapp: false, email: false, emailAddress: emailTo };

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
