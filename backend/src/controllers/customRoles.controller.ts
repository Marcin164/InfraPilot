import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { CustomRolesService } from 'src/services/customRoles.service';
import { AuditService } from 'src/services/audit.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import {
  PERMISSION_GROUPS,
  PERMISSION_IMPLIES,
} from 'src/decorators/permissions.catalog';
import {
  CreateCustomRoleDto,
  UpdateCustomRoleDto,
} from 'src/dto/customRoles.dto';

@UseGuards(AuthGuard)
@Controller('custom-roles')
export class CustomRolesController {
  private readonly logger = new Logger(CustomRolesController.name);

  constructor(
    private readonly customRolesService: CustomRolesService,
    private readonly auditService: AuditService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  private actorFrom(req: any): string | null {
    return req?.user?.properties?.metadata?.id ?? req?.user?.id ?? null;
  }

  @Get('catalog')
  getCatalog() {
    return { groups: PERMISSION_GROUPS, implies: PERMISSION_IMPLIES };
  }

  @Get()
  findAll() {
    return this.customRolesService.listRoles();
  }

  @Get('assignments')
  getAssignments(@Query('userIds') userIds?: string) {
    const ids = (userIds ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    return this.customRolesService.getAssignmentsForUsers(ids);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customRolesService.getRole(id);
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Post()
  async create(@Body() dto: CreateCustomRoleDto, @Req() req: any) {
    const role = await this.customRolesService.createRole(dto);
    await this.auditService.log('CustomRole', role.id, 'created', {
      actor: this.actorFrom(req),
      name: role.name,
      grantsAllPermissions: role.grantsAllPermissions,
      permissions: role.permissions,
    });
    return role;
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomRoleDto,
    @Req() req: any,
  ) {
    const role = await this.customRolesService.updateRole(id, dto);
    await this.auditService.log('CustomRole', role.id, 'updated', {
      actor: this.actorFrom(req),
      name: role.name,
      grantsAllPermissions: role.grantsAllPermissions,
      permissions: role.permissions,
    });
    return role;
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const role = await this.customRolesService.getRole(id);
    const result = await this.customRolesService.deleteRole(id);
    await this.auditService.log('CustomRole', id, 'deleted', {
      actor: this.actorFrom(req),
      name: role.name,
    });
    return result;
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Post(':id/users/:userId')
  async assign(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const result = await this.customRolesService.assignRole(id, userId);
    await this.auditService.log('CustomRole', id, 'user_assigned', {
      actor: this.actorFrom(req),
      userId,
    });
    await this.notifyRoleGranted(id, userId);
    return result;
  }

  private async notifyRoleGranted(roleId: string, userId: string): Promise<void> {
    try {
      const role = await this.customRolesService.getRole(roleId);
      if (!role.grantsAllPermissions) return;
      await this.dispatcher.dispatchOpsAlert({
        event: 'role_granted',
        title: `Admin role granted: ${role.name}`,
        body: `User ${userId} was granted the "${role.name}" role, which has full admin permissions.`,
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch role_granted alert for role ${roleId}: ${(err as Error).message}`);
    }
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Delete(':id/users/:userId')
  async unassign(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const result = await this.customRolesService.unassignRole(id, userId);
    await this.auditService.log('CustomRole', id, 'user_unassigned', {
      actor: this.actorFrom(req),
      userId,
    });
    return result;
  }
}
