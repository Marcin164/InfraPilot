import { Module } from '@nestjs/common';
import { CustomRolesController } from 'src/controllers/customRoles.controller';
import { AuditModule } from './audit.module';

/**
 * CustomRolesService, and the repositories it needs (CustomRole,
 * UserCustomRole, Users), are already provided globally by
 * AccessControlModule -- this module only adds the HTTP surface (plus
 * AuditModule, for logging role/permission changes).
 */
@Module({
  imports: [AuditModule],
  controllers: [CustomRolesController],
})
export class CustomRolesModule {}
