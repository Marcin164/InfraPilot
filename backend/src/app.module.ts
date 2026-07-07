import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import adConfig from './config/ad.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Users } from './entities/users.entity';
import { Devices } from './entities/devices.entity';
import { Flows } from './entities/flows.entity';
import { Forms } from './entities/forms.entity';
import { Histories } from './entities/histories.entity';
import { HistoryApprovers } from './entities/historyApprovers.entity';
import { HistoryComponents } from './entities/historyComponents.entity';
import { Applications } from './entities/applications.entity';
import { DevicesApplications } from './entities/devicesApplications.entity';
import { Dashboards } from './entities/dashboards.entity';
import { HistoryModule } from './modules/histories.module';
import { DevicesModule } from './modules/devices.module';
import { UsersModule } from './modules/users.module';
import { FormsModule } from './modules/forms.module';
import { FlowsModule } from './modules/flows.module';
import { ApplicationsModule } from './modules/applications.module';
import { AuthModule } from './modules/auth.module';
import { DashboardsModule } from './modules/dashboards.module';
import { Tickets } from './entities/tickets.entity';
import { TicketsComments } from './entities/ticketsComments.entity';
import { TicketsModule } from './modules/tickets.module';
import { TicketsApprovals } from './entities/ticketsApprovals.entity';
import { UserSettings } from './entities/userSettings.entity';
import { SettingsModule } from './modules/settings.module';
import { AdminSettings } from './entities/adminSettings.entity';
import { Calendar } from './entities/calendar.entity';
import { CalendarHoliday } from './entities/calendarHoliday.entity';
import { SlaDefinition } from './entities/slaDefinition.entity';
import { SlaInstance } from './entities/slaInstance.entity';
import { SlaPause } from './entities/slaPause.entity';
import { SlaRule } from './entities/slaRule.entity';
import { SlaModule } from './modules/sla.module';
import { AuditModule } from './modules/audit.module';
import { SlaEscalationInstance } from './entities/slaEscalationInstance.entity';
import { SlaEscalationDefinition } from './entities/slaEscalationDefinition.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestLoggingInterceptor } from './interceptors/requestLogging.interceptor';
import { HealthController } from './controllers/health.controller';
import { SystemAuditLog } from './entities/systemAuditLog.entity';
import { ReportsModule } from './modules/reports.module';
import { SearchModule } from './modules/search.module';
import { AssignmentGroupsModule } from './modules/assignmentGroups.module';
import { AssignmentGroup } from './entities/assignmentGroup.entity';
import { TicketActivity } from './entities/ticketActivity.entity';
import { KnowledgeSpace } from './entities/knowledgeSpace.entity';
import { KnowledgeArticle } from './entities/knowledgeArticle.entity';
import { KnowledgeModule } from './modules/knowledge.module';
import { AccessControlModule } from './modules/accessControl.module';
import { PrivacyModule } from './modules/privacy.module';
import { RetentionPolicy } from './entities/retentionPolicy.entity';
import { RetentionModule } from './modules/retention.module';
import { EvidenceModule } from './modules/evidence.module';
import { LegalHold } from './entities/legalHold.entity';
import { CveMatch } from './entities/cveMatch.entity';
import { CveModule } from './modules/cve.module';
import { ComplianceRule } from './entities/complianceRule.entity';
import { ComplianceResult } from './entities/complianceResult.entity';
import { ComplianceModule } from './modules/compliance.module';
import { DeviceTag } from './entities/deviceTag.entity';
import { DeviceTagMap } from './entities/deviceTagMap.entity';
import { AgentTask } from './entities/agentTask.entity';
import { DeviceScan } from './entities/deviceScan.entity';
import { FleetModule } from './modules/fleet.module';
import { TicketTemplate } from './entities/ticketTemplate.entity';
import { TicketAutoTagRule } from './entities/ticketAutoTagRule.entity';
import { TicketCategory } from './entities/ticketCategory.entity';
import { TicketWorkflow } from './entities/ticketWorkflow.entity';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notificationPreference.entity';
import { NotificationModule } from './modules/notification.module';
import { SoftwareLicense } from './entities/softwareLicense.entity';
import { SoftwareLicenseAssignment } from './entities/softwareLicenseAssignment.entity';
import { SoftwareLicenseModule } from './modules/softwareLicense.module';
import { Location } from './entities/location.entity';
import { LocationModule } from './modules/location.module';
import { NetworkConnection } from './entities/networkConnection.entity';
import { NetworkConnectionsModule } from './modules/networkConnections.module';
import { NetworkDeviceCredential } from './entities/networkDeviceCredential.entity';
import { NetworkDeviceConfigBackup } from './entities/networkDeviceConfigBackup.entity';
import { Subnet } from './entities/subnet.entity';
import { IpAllocation } from './entities/ipAllocation.entity';
import { DeviceEnrollmentToken } from './entities/deviceEnrollmentToken.entity';
import { IpamModule } from './modules/ipam.module';
import { Maintenance } from './entities/maintenance.entity';
import { MaintenanceModule } from './modules/maintenance.module';
import { PurchaseOrder } from './entities/purchaseOrder.entity';
import { PurchaseOrderModule } from './modules/purchaseOrder.module';
import { AiModule } from './modules/ai.module';
import { M365Module } from './modules/m365.module';
import { BootstrapService } from './services/bootstrap.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './controllers/metrics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [adConfig],
    }),
    PrometheusModule.register({ controller: MetricsController }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      schema: process.env.DB_SCHEMA || 'public',
      entities: [
        Users,
        Devices,
        Flows,
        Forms,
        Histories,
        HistoryApprovers,
        HistoryComponents,
        Applications,
        DevicesApplications,
        Dashboards,
        Tickets,
        TicketsComments,
        TicketsApprovals,
        UserSettings,
        AdminSettings,
        Calendar,
        CalendarHoliday,
        SlaDefinition,
        SlaInstance,
        SlaPause,
        SlaRule,
        SlaEscalationDefinition,
        SlaEscalationInstance,
        SystemAuditLog,
        AssignmentGroup,
        TicketActivity,
        KnowledgeSpace,
        KnowledgeArticle,
        RetentionPolicy,
        LegalHold,
        CveMatch,
        ComplianceRule,
        ComplianceResult,
        DeviceTag,
        DeviceTagMap,
        AgentTask,
        DeviceScan,
        TicketTemplate,
        TicketAutoTagRule,
        TicketCategory,
        TicketWorkflow,
        Notification,
        NotificationPreference,
        SoftwareLicense,
        SoftwareLicenseAssignment,
        Location,
        Maintenance,
        PurchaseOrder,
        NetworkConnection,
        NetworkDeviceCredential,
        NetworkDeviceConfigBackup,
        Subnet,
        IpAllocation,
        DeviceEnrollmentToken,
      ],
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      migrationsRun: process.env.TYPEORM_SYNCHRONIZE !== 'true',
      migrations: [require('path').join(__dirname, 'migrations', '*.{ts,js}')],
    }),
    TypeOrmModule.forFeature([
      Users,
      Devices,
      Flows,
      Forms,
      Histories,
      HistoryApprovers,
      HistoryComponents,
      Applications,
      DevicesApplications,
      Dashboards,
      Tickets,
      TicketsComments,
      TicketsApprovals,
      UserSettings,
      AdminSettings,
      Calendar,
      CalendarHoliday,
      SlaDefinition,
      SlaInstance,
      SlaPause,
      SlaRule,
      SlaEscalationDefinition,
      SlaEscalationInstance,
      SystemAuditLog,
      AssignmentGroup,
      TicketActivity,
    ]),
    ScheduleModule.forRoot(),
    // Global in-process event bus — emit domain events here, listen with
    // @OnEvent(...) elsewhere to wire up cross-entity automation.
    EventEmitterModule.forRoot(),
    // Global rate limit — defaults are conservative; specific endpoints
    // can opt out with @SkipThrottle() or tighten with @Throttle({...}).
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 30 },
      { name: 'medium', ttl: 10_000, limit: 200 },
      { name: 'long', ttl: 60_000, limit: 1000 },
    ]),
    AccessControlModule,
    DevicesModule,
    UsersModule,
    FormsModule,
    FlowsModule,
    HistoryModule,
    ApplicationsModule,
    DashboardsModule,
    AuthModule,
    TicketsModule,
    SettingsModule,
    SlaModule,
    AuditModule,
    PrivacyModule,
    RetentionModule,
    EvidenceModule,
    CveModule,
    ComplianceModule,
    FleetModule,
    ReportsModule,
    SearchModule,
    AssignmentGroupsModule,
    KnowledgeModule,
    NotificationModule,
    SoftwareLicenseModule,
    LocationModule,
    MaintenanceModule,
    PurchaseOrderModule,
    NetworkConnectionsModule,
    IpamModule,
    AiModule,
    M365Module,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    BootstrapService,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
