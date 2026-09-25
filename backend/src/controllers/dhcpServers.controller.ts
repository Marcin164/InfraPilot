import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  CreateDhcpServerDto,
  DhcpServerService,
  UpdateDhcpServerDto,
} from 'src/services/dhcpServer.service';
import { LeaseSyncService } from 'src/services/leaseSync.service';

// Own dedicated permission (dhcp.view/dhcp.manage), separate from
// ipam.view/ipam.manage on purpose -- configuring a DHCP lease-sync
// integration is a more specialized network-infra task than documenting
// subnets/allocations, and an org may want to grant one without the other.
// Not devices.connection.manage either (that code is scoped to
// remote-assist only, see permissions.catalog.ts).
@UseGuards(AuthGuard)
@Controller('dhcp-servers')
export class DhcpServersController {
  constructor(
    private readonly dhcpServerService: DhcpServerService,
    private readonly leaseSyncService: LeaseSyncService,
  ) {}

  @RequiresPermission('dhcp.view')
  @Get()
  findAll() {
    return this.dhcpServerService.findAll();
  }

  @RequiresPermission('dhcp.view')
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.dhcpServerService.findOne(id);
  }

  @RequiresPermission('dhcp.manage')
  @Post()
  create(@Body() dto: CreateDhcpServerDto) {
    return this.dhcpServerService.create(dto);
  }

  @RequiresPermission('dhcp.manage')
  @Put('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDhcpServerDto) {
    return this.dhcpServerService.update(id, dto);
  }

  @RequiresPermission('dhcp.manage')
  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.dhcpServerService.remove(id);
  }

  @RequiresPermission('dhcp.manage')
  @Post('/:id/sync')
  runSync(@Param('id') id: string, @Req() req: any) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    return this.leaseSyncService.runSync(id, actor);
  }
}
