import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Applications } from 'src/entities/applications.entity';
import { DevicesApplications } from 'src/entities/devicesApplications.entity';
import { CveMatch } from 'src/entities/cveMatch.entity';
import { CveService } from 'src/services/cve.service';
import { CveController } from 'src/controllers/cve.controller';
import { CveWorker } from 'src/workers/cve.worker';
import { CveCriticalListener } from 'src/listeners/cveCritical.listener';
import { AuditModule } from './audit.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Applications, DevicesApplications, CveMatch]),
    AuditModule,
    NotificationModule,
  ],
  controllers: [CveController],
  providers: [CveService, CveWorker, CveCriticalListener],
  exports: [CveService],
})
export class CveModule {}
