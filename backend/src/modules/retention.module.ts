import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetentionPolicy } from 'src/entities/retentionPolicy.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { RetentionController } from 'src/controllers/retention.controller';
import { RetentionService } from 'src/services/retention.service';
import { RetentionWorker } from 'src/workers/retention.worker';
import { AuditModule } from './audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RetentionPolicy, AdminSettings]),
    AuditModule,
  ],
  controllers: [RetentionController],
  providers: [RetentionService, RetentionWorker],
  exports: [RetentionService],
})
export class RetentionModule {}
