import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Patch,
  Req,
  UseGuards,
  Param,
  Query,
  Body,
  Delete,
} from '@nestjs/common';
import { Request } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { UsersService } from 'src/services/users.service';
import { ActiveDirectoryService } from 'src/services/active-directory.service';
import { CustomRolesService } from 'src/services/customRoles.service';
import {
  CreateUserDto,
  InsertManyUsersDto,
  BulkImportUsersDto,
  UpdateUserDto,
} from 'src/dto/users.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adService: ActiveDirectoryService,
    private readonly customRolesService: CustomRolesService,
  ) {}

  private callerIdFrom(req: any): string | undefined {
    return req?.user?.properties?.metadata?.id;
  }

  // A regular (end-user portal) user may only look up their own profile;
  // staff with users.view can look up anyone's. Mirrors
  // devices.controller.ts's assertSelfOrDevicesView.
  private async assertSelfOrUsersView(req: any, targetUserId: string) {
    const callerId = this.callerIdFrom(req);
    if (callerId && callerId === targetUserId) return;

    if (callerId) {
      const granted = await this.customRolesService.getUserPermissions(callerId);
      if (granted.has('users.view')) return;
    }

    throw new ForbiddenException('You may only view your own profile');
  }

  @UseGuards(AuthGuard, MfaGuard)
  @RequiresPermission('admin.activeDirectory.config')
  @Get('/ad/user')
  async syncADUser(@Query('username') username: string) {
    const users = await this.adService.findAllUsers();
    await this.usersService.insertManyUsersAD(users);
    return users || { message: 'Użytkownik nie znaleziony' };
  }

  @UseGuards(AuthGuard)
  @RequiresPermission('users.view')
  @Get()
  async findAll(@Req() req: Request): Promise<any> {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard, MfaGuard)
  @RequiresPermission('users.add')
  @Post()
  async insertOne(@Body() body: CreateUserDto): Promise<any> {
    return this.usersService.insertOne(body);
  }

  @UseGuards(AuthGuard, MfaGuard)
  @RequiresPermission('users.add')
  @Post('/many')
  async insertMany(@Body() body: InsertManyUsersDto): Promise<any> {
    return this.usersService.insertMany(body.users);
  }

  @UseGuards(AuthGuard, MfaGuard)
  @RequiresPermission('users.add')
  @Post('bulk-import')
  async bulkImport(@Body() body: BulkImportUsersDto): Promise<any> {
    return this.usersService.bulkImport(body.rows ?? []);
  }

  @UseGuards(AuthGuard, MfaGuard)
  @RequiresPermission('users.delete')
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<any> {
    return this.usersService.delete(id);
  }

  @UseGuards(AuthGuard, MfaGuard)
  @RequiresPermission('users.edit')
  @Patch(':id')
  async update(
    @Body() body: UpdateUserDto,
    @Param('id') id: string,
  ): Promise<any> {
    return this.usersService.update(body, id);
  }

  @UseGuards(AuthGuard)
  @RequiresPermission('users.view')
  @Get('/table')
  async findAllTable(@Query() query: any): Promise<any> {
    return this.usersService.findAllTable(query);
  }

  @UseGuards(AuthGuard)
  @RequiresPermission('users.view')
  @Get('/filters')
  async getFilters() {
    return this.usersService.getFilterOptions();
  }

  // Directory/picker data (who's an approver / on helpdesk) needed broadly
  // -- e.g. any employee routing a request needs to see who can approve it
  // -- left open on purpose, same reasoning as devices.controller.ts's
  // /options endpoint.
  @UseGuards(AuthGuard)
  @Get('/approvers')
  async findApprovers(): Promise<any> {
    return this.usersService.findApprovers();
  }

  @UseGuards(AuthGuard)
  @Get('/helpdesk')
  async findHelpdesk(): Promise<any> {
    return this.usersService.findHelpdesk();
  }

  // Self-or-staff: the end-user portal (Pages/User/Account) fetches the
  // caller's own profile through this exact route with no users.view at all.
  @UseGuards(AuthGuard)
  @Get('/:id')
  async findUser(@Param('id') id: string, @Req() req: any): Promise<any> {
    await this.assertSelfOrUsersView(req, id);
    return this.usersService.findUser(id);
  }

  // Self ONLY -- every real frontend caller (usePermissions()) only ever
  // asks for its own permission set, to decide what UI to show. There's no
  // legitimate "staff checks someone else's permissions" flow through this
  // endpoint (the Custom Roles assignment matrix uses a separate endpoint),
  // so unlike findUser above there's no staff-permission escape hatch --
  // handing out any other employee's exact permission set is pure
  // reconnaissance value with no offsetting feature need.
  @UseGuards(AuthGuard)
  @Get('/:id/permissions')
  async getUserPermissions(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<{ permissions: string[] }> {
    const callerId = this.callerIdFrom(req);
    if (!callerId || callerId !== id) {
      throw new ForbiddenException('You may only view your own permissions');
    }
    const granted = await this.customRolesService.getUserPermissions(id);
    return { permissions: Array.from(granted) };
  }

  @UseGuards(AuthGuard)
  @RequiresPermission('users.provision')
  @Post('/:id/link-auth')
  async linkAuth(@Param('id') id: string) {
    return this.usersService.linkAuthByEmail(id);
  }

  @UseGuards(AuthGuard)
  @RequiresPermission('users.provision')
  @Post('/:id/provision-auth')
  async provisionAuth(@Param('id') id: string) {
    return this.usersService.provisionInAuth(id);
  }

  // Not currently called from the frontend, but reachable directly --
  // matches users.provision's "is this account properly linked" concern.
  @UseGuards(AuthGuard)
  @RequiresPermission('users.provision')
  @Get('/:id/verify-auth')
  async verifyAuth(@Param('id') id: string) {
    return this.usersService.verifyAuthLink(id);
  }
}
