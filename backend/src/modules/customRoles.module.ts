import { Module } from '@nestjs/common';
import { CustomRolesController } from 'src/controllers/customRoles.controller';
import { AuditModule } from './audit.module';
import { NotificationModule } from './notification.module';

/**
 * CustomRolesService, and the repositories it needs (CustomRole,
 * UserCustomRole, Users), are already provided globally by
 * AccessControlModule -- this module only adds the HTTP surface (plus
 * AuditModule, for logging role/permission changes, and NotificationModule,
 * for the role_granted ops alert when an admin-level role is assigned).
 */
@Module({
  imports: [AuditModule, NotificationModule],
  controllers: [CustomRolesController],
})
export class CustomRolesModule {}
