import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { SoftwareLicenseAssignment } from 'src/entities/softwareLicenseAssignment.entity';
import { SoftwareLicenseService } from 'src/services/softwareLicense.service';
import { SoftwareLicenseController } from 'src/controllers/softwareLicense.controller';
import { LicenseAlertWorker } from 'src/workers/licenseAlert.worker';
import { AuditModule } from './audit.module';
import { NotificationModule } from './notification.module';
import { Users } from 'src/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SoftwareLicense, SoftwareLicenseAssignment, Users]),
    AuditModule,
    NotificationModule,
  ],
  controllers: [SoftwareLicenseController],
  providers: [SoftwareLicenseService, LicenseAlertWorker],
  exports: [SoftwareLicenseService],
})
export class SoftwareLicenseModule {}
