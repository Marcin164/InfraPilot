import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { Users } from 'src/entities/users.entity';
import { NotificationPreference } from 'src/entities/notificationPreference.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { NotificationService } from 'src/services/notification.service';
import { NotificationPreferencesService } from 'src/services/notificationPreferences.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { OpsNotificationsService } from 'src/services/opsNotifications.service';
import { NotificationController } from 'src/controllers/notification.controller';
import { NotificationPreferencesController } from 'src/controllers/notificationPreferences.controller';
import { OpsNotificationsController } from 'src/controllers/opsNotifications.controller';
import { MailModule } from './mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Users,
      NotificationPreference,
      AdminSettings,
    ]),
    MailModule,
  ],
  controllers: [
    NotificationController,
    NotificationPreferencesController,
    OpsNotificationsController,
  ],
  providers: [
    NotificationService,
    NotificationPreferencesService,
    NotificationDispatcherService,
    OpsNotificationsService,
  ],
  exports: [
    NotificationService,
    NotificationPreferencesService,
    NotificationDispatcherService,
    OpsNotificationsService,
  ],
})
export class NotificationModule {}
