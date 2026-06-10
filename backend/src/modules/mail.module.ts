import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { MailService } from 'src/services/mail.service';
import { SmsService } from 'src/services/sms.service';
import { SmtpSettingsService } from 'src/services/smtp-settings.service';
import { SmtpController } from 'src/controllers/smtp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings])],
  controllers: [SmtpController],
  providers: [SmtpSettingsService, MailService, SmsService],
  exports: [MailService, SmsService, SmtpSettingsService],
})
export class MailModule {}
