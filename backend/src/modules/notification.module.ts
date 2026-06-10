import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { Users } from 'src/entities/users.entity';
import { NotificationPreference } from 'src/entities/notificationPreference.entity';
import { UserSettings } from 'src/entities/userSettings.entity';
import { NotificationService } from 'src/services/notification.service';
import { NotificationPreferencesService } from 'src/services/notificationPreferences.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { NotificationController } from 'src/controllers/notification.controller';
import { NotificationPreferencesController } from 'src/controllers/notificationPreferences.controller';
import { MailModule } from './mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Users, NotificationPreference, UserSettings]),
    MailModule,
  ],
  controllers: [NotificationController, NotificationPreferencesController],
  providers: [
    NotificationService,
    NotificationPreferencesService,
    NotificationDispatcherService,
  ],
  exports: [
    NotificationService,
    NotificationPreferencesService,
    NotificationDispatcherService,
  ],
})
export class NotificationModule {}
