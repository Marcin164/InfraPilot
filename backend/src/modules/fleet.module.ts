import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devices } from 'src/entities/devices.entity';
import { FleetService } from 'src/services/fleet.service';
import { FleetController } from 'src/controllers/fleet.controller';
import { AgentStaleWorker } from 'src/workers/agentStale.worker';
import { ComplianceModule } from './compliance.module';
import { CveModule } from './cve.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Devices]),
    ComplianceModule,
    CveModule,
    NotificationModule,
  ],
  controllers: [FleetController],
  providers: [FleetService, AgentStaleWorker],
  exports: [FleetService],
})
export class FleetModule {}
