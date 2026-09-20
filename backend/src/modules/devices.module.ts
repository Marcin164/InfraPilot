import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from 'src/controllers/devices.controller';
import { NetworkDeviceBackupController } from 'src/controllers/networkDeviceBackup.controller';
import { Devices } from 'src/entities/devices.entity';
import { Applications } from 'src/entities/applications.entity';
import { DevicesApplications } from 'src/entities/devicesApplications.entity';
import { DeviceTag } from 'src/entities/deviceTag.entity';
import { DeviceTagMap } from 'src/entities/deviceTagMap.entity';
import { AgentTask } from 'src/entities/agentTask.entity';
import { DeviceScan } from 'src/entities/deviceScan.entity';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { NetworkDeviceConfigBackup } from 'src/entities/networkDeviceConfigBackup.entity';
import { IpAllocation } from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';
import { DhcpServer } from 'src/entities/dhcpServer.entity';
import { DevicesService } from 'src/services/devices.service';
import { SoftwareInventoryService } from 'src/services/softwareInventory.service';
import { DeviceTagsService } from 'src/services/deviceTags.service';
import { AgentTaskService } from 'src/services/agentTask.service';
import { DeviceScanService } from 'src/services/deviceScan.service';
import { DeviceReportService } from 'src/services/deviceReport.service';
import { HandoverFormService } from 'src/services/handoverForm.service';
import { RemoteAssistService } from 'src/services/remoteAssist.service';
import { DeviceIdentityService } from 'src/services/deviceIdentity.service';
import { AgentTaskWorker } from 'src/workers/agentTask.worker';
import { NetworkScanWorker } from 'src/workers/networkScan.worker';
import { AgentInstallerSyncWorker } from 'src/workers/agentInstallerSync.worker';
import { WarrantyAlertWorker } from 'src/workers/warrantyAlert.worker';
import { PingMonitorWorker } from 'src/workers/pingMonitor.worker';
import { ConfigBackupWorker } from 'src/workers/configBackup.worker';
import { LeaseSyncWorker } from 'src/workers/leaseSync.worker';
import { NetworkDeviceBackupService } from 'src/services/networkDeviceBackup.service';
import { LeaseSyncService } from 'src/services/leaseSync.service';
import { DhcpServerService } from 'src/services/dhcpServer.service';
import { DhcpServersController } from 'src/controllers/dhcpServers.controller';
import { SshScrapeDriver } from 'src/dhcp/drivers/sshScrape.driver';
import { DhcpDriverRegistry } from 'src/dhcp/dhcpDriver.registry';
import { DHCP_LEASE_DRIVERS } from 'src/dhcp/dhcpLeaseDriver.interface';
import { CveModule } from './cve.module';
import { AgentGuard } from 'src/guards/agentGuard.guard';
import { EnrollmentGuard } from 'src/guards/enrollmentGuard.guard';
import { AuditModule } from './audit.module';
import { ComplianceModule } from './compliance.module';
import { NotificationModule } from './notification.module';
import { IpamModule } from './ipam.module';
import { FormsModule } from './forms.module';
import { Users } from 'src/entities/users.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { AgentTokenService } from 'src/services/agent-token.service';
import { AgentInstallerService } from 'src/services/agent-installer.service';
import { AgentBootstrapService } from 'src/services/agent-bootstrap.service';
import { DeviceEnrollmentToken } from 'src/entities/deviceEnrollmentToken.entity';
import { DeviceEnrollmentTokenService } from 'src/services/deviceEnrollmentToken.service';
import { TicketDeviceLifecycleListener } from 'src/listeners/ticketDeviceLifecycle.listener';

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
      NetworkDeviceCredential,
      NetworkDeviceConfigBackup,
      IpAllocation,
      Subnet,
      DhcpServer,
      DeviceEnrollmentToken,
    ]),
    AuditModule,
    ComplianceModule,
    CveModule,
    NotificationModule,
    IpamModule,
    FormsModule,
  ],
  controllers: [DevicesController, NetworkDeviceBackupController, DhcpServersController],
  providers: [
    DevicesService,
    SoftwareInventoryService,
    DeviceTagsService,
    AgentTaskService,
    DeviceScanService,
    DeviceReportService,
    HandoverFormService,
    RemoteAssistService,
    DeviceIdentityService,
    NetworkDeviceBackupService,
    LeaseSyncService,
    DhcpServerService,
    SshScrapeDriver,
    DhcpDriverRegistry,
    {
      provide: DHCP_LEASE_DRIVERS,
      useFactory: (sshScrapeDriver: SshScrapeDriver) => [sshScrapeDriver],
      inject: [SshScrapeDriver],
    },
    AgentTaskWorker,
    NetworkScanWorker,
    AgentInstallerSyncWorker,
    WarrantyAlertWorker,
    PingMonitorWorker,
    ConfigBackupWorker,
    LeaseSyncWorker,
    AgentGuard,
    EnrollmentGuard,
    AgentTokenService,
    AgentInstallerService,
    AgentBootstrapService,
    DeviceEnrollmentTokenService,
    TicketDeviceLifecycleListener,
  ],
  exports: [
    DevicesService,
    SoftwareInventoryService,
    DeviceTagsService,
    AgentTaskService,
    DeviceScanService,
    DeviceReportService,
    HandoverFormService,
    AgentTokenService,
    AgentInstallerService,
  ],
})
export class DevicesModule {}
