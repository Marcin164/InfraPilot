import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { CreateDhcpServerDto, DhcpServerService, UpdateDhcpServerDto } from 'src/services/dhcpServer.service';
import { LeaseSyncService } from 'src/services/leaseSync.service';

@UseGuards(AuthGuard)
@Roles(Role.Admin)
@Controller('dhcp-servers')
export class DhcpServersController {
  constructor(
    private readonly dhcpServerService: DhcpServerService,
    private readonly leaseSyncService: LeaseSyncService,
  ) {}

  @Get()
  findAll() {
    return this.dhcpServerService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.dhcpServerService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDhcpServerDto) {
    return this.dhcpServerService.create(dto);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDhcpServerDto) {
    return this.dhcpServerService.update(id, dto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.dhcpServerService.remove(id);
  }

  @Post('/:id/sync')
  runSync(@Param('id') id: string, @Req() req: any) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    return this.leaseSyncService.runSync(id, actor);
  }
}
