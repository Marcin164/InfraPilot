import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Notification events the dispatcher can fire. Adding one here is the
 * single place to extend coverage — UI lists them automatically.
 */
export const NOTIFICATION_EVENTS = [
  'ticket_assigned',
  'ticket_state_changed',
  'ticket_comment',
  'ticket_mention',
  'ticket_sla_breach',
  'ticket_auto_followup',
  'cve_critical',
  'scan_completed',
  'compliance_failing',
  'workflow_step_failed',
  'license_expiring',
  'license_expired',
  'warranty_expiring',
  'device_down',
  'config_backup_failed',
  'ip_conflict_detected',
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export type NotificationChannel = 'inapp' | 'email' | 'sms';

/**
 * One row per (user, event, channel). Defaulted on the fly: missing rows
 * mean "use the channel's default" (in-app on, email off for most, SMS
 * off for everything except SLA breach + critical CVE).
 */
@Entity()
@Index(['userId', 'event', 'channel'], { unique: true })
export class NotificationPreference {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  event: NotificationEvent;

  @Column({ type: 'varchar', length: 16 })
  channel: NotificationChannel;

  @Column({ default: true })
  enabled: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
