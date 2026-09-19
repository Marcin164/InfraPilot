import {
  Controller,
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

  @UseGuards(AuthGuard, MfaGuard)
  @RequiresPermission('admin.activeDirectory.config')
  @Get('/ad/user')
  async syncADUser(@Query('username') username: string) {
    const users = await this.adService.findAllUsers();
    await this.usersService.insertManyUsersAD(users);
    return users || { message: 'Użytkownik nie znaleziony' };
  }

  @UseGuards(AuthGuard)
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
  @Get('/table')
  async findAllTable(@Query() query: any): Promise<any> {
    return this.usersService.findAllTable(query);
  }

  @UseGuards(AuthGuard)
  @Get('/filters')
  async getFilters() {
    return this.usersService.getFilterOptions();
  }

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

  @UseGuards(AuthGuard)
  @Get('/:id')
  async findUser(@Param('id') id: string): Promise<any> {
    return this.usersService.findUser(id);
  }

  @UseGuards(AuthGuard)
  @Get('/:id/permissions')
  async getUserPermissions(
    @Param('id') id: string,
  ): Promise<{ permissions: string[] }> {
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

  @UseGuards(AuthGuard)
  @Get('/:id/verify-auth')
  async verifyAuth(@Param('id') id: string) {
    return this.usersService.verifyAuthLink(id);
  }
}
