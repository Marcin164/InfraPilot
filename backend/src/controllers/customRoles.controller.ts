import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { CustomRolesService } from 'src/services/customRoles.service';
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
  constructor(private readonly customRolesService: CustomRolesService) {}

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
  create(@Body() dto: CreateCustomRoleDto) {
    return this.customRolesService.createRole(dto);
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomRoleDto) {
    return this.customRolesService.updateRole(id, dto);
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.customRolesService.deleteRole(id);
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Post(':id/users/:userId')
  assign(@Param('id') id: string, @Param('userId') userId: string) {
    return this.customRolesService.assignRole(id, userId);
  }

  @RequiresPermission('admin.roleAssignment.manage')
  @Delete(':id/users/:userId')
  unassign(@Param('id') id: string, @Param('userId') userId: string) {
    return this.customRolesService.unassignRole(id, userId);
  }
}
