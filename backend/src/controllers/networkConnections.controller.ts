import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import {
  NetworkConnectionsService,
  CreateNetworkConnectionDto,
} from 'src/services/networkConnections.service';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('network-connections')
export class NetworkConnectionsController {
  constructor(
    private readonly connectionsService: NetworkConnectionsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  findAll(@Query('deviceId') deviceId?: string) {
    return this.connectionsService.findAll(deviceId);
  }

  @Get('topology')
  getTopology() {
    return this.connectionsService.getTopology();
  }

  @Roles(Role.Admin)
  @Post()
  async create(@Body() dto: CreateNetworkConnectionDto, @Req() req: any) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    const conn = await this.connectionsService.create(dto, actor);
    await this.auditService.log('NETWORK_CONNECTION', conn.id, 'CREATED', {
      sourceDeviceId: conn.sourceDeviceId,
      targetDeviceId: conn.targetDeviceId,
    });
    return conn;
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.connectionsService.remove(id);
    await this.auditService.log('NETWORK_CONNECTION', id, 'DELETED', {});
    return { ok: true };
  }
}
