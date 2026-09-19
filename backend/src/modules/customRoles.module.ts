import { Module } from '@nestjs/common';
import { CustomRolesController } from 'src/controllers/customRoles.controller';

/**
 * CustomRolesService, and the repositories it needs (CustomRole,
 * UserCustomRole, Users), are already provided globally by
 * AccessControlModule -- this module only adds the HTTP surface.
 */
@Module({
  controllers: [CustomRolesController],
})
export class CustomRolesModule {}
