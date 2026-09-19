import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/entities/users.entity';
import { CustomRole } from 'src/entities/customRole.entity';
import { UserCustomRole } from 'src/entities/userCustomRole.entity';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CustomRolesService } from 'src/services/customRoles.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Users, CustomRole, UserCustomRole])],
  providers: [
    MfaGuard,
    PermissionsGuard,
    CustomRolesService,
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [MfaGuard, PermissionsGuard, CustomRolesService],
})
export class AccessControlModule {}
