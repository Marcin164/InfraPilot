import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from 'src/controllers/devices.controller';
import { Devices } from 'src/entities/devices.entity';
import { Applications } from 'src/entities/applications.entity';
import { DevicesApplications } from 'src/entities/devicesApplications.entity';
import { DeviceTag } from 'src/entities/deviceTag.entity';
import { DeviceTagMap } from 'src/entities/deviceTagMap.entity';
import { AgentTask } from 'src/entities/agentTask.entity';
import { DeviceScan } from 'src/entities/deviceScan.entity';
import { DevicesService } from 'src/services/devices.service';
import { SoftwareInventoryService } from 'src/services/softwareInventory.service';
import { DeviceTagsService } from 'src/services/deviceTags.service';
import { AgentTaskService } from 'src/services/agentTask.service';
import { DeviceScanService } from 'src/services/deviceScan.service';
import { DeviceReportService } from 'src/services/deviceReport.service';
import { RemoteAssistService } from 'src/services/remoteAssist.service';
import { DeviceIdentityService } from 'src/services/deviceIdentity.service';
import { AgentTaskWorker } from 'src/workers/agentTask.worker';
import { WarrantyAlertWorker } from 'src/workers/warrantyAlert.worker';
import { CveModule } from './cve.module';
import { AgentGuard } from 'src/guards/agentGuard.guard';
import { EnrollmentGuard } from 'src/guards/enrollmentGuard.guard';
import { AuditModule } from './audit.module';
import { ComplianceModule } from './compliance.module';
import { NotificationModule } from './notification.module';
import { Users } from 'src/entities/users.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { AgentTokenService } from 'src/services/agent-token.service';
import { AgentInstallerService } from 'src/services/agent-installer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Devices,
      Applications,
      DevicesApplications,
      DeviceTag,
      DeviceTagMap,
      AgentTask,
      DeviceScan,
      Users,
      AdminSettings,
    ]),
    AuditModule,
    ComplianceModule,
    CveModule,
    NotificationModule,
  ],
  controllers: [DevicesController],
  providers: [
    DevicesService,
    SoftwareInventoryService,
    DeviceTagsService,
    AgentTaskService,
    DeviceScanService,
    DeviceReportService,
    RemoteAssistService,
    DeviceIdentityService,
    AgentTaskWorker,
    WarrantyAlertWorker,
    AgentGuard,
    EnrollmentGuard,
    AgentTokenService,
    AgentInstallerService,
  ],
  exports: [
    SoftwareInventoryService,
    DeviceTagsService,
    AgentTaskService,
    DeviceScanService,
    DeviceReportService,
    AgentTokenService,
    AgentInstallerService,
  ],
})
export class DevicesModule {}
