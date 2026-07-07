import { IsArray, IsBoolean, IsIn, IsString } from 'class-validator';
import { NOTIFICATION_EVENTS } from 'src/entities/notificationPreference.entity';
import type { NotificationChannel } from 'src/entities/notificationPreference.entity';

export class MarkNotificationsReadDto {
  @IsArray() @IsString({ each: true }) ids: string[];
}

const NOTIFICATION_CHANNELS: NotificationChannel[] = ['inapp', 'email', 'sms'];

export class PreferenceRowDto {
  @IsIn(NOTIFICATION_EVENTS) event: (typeof NOTIFICATION_EVENTS)[number];
  @IsIn(NOTIFICATION_CHANNELS) channel: NotificationChannel;
  @IsBoolean() enabled: boolean;
}
