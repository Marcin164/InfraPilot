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
import {
  IpamService,
  CreateSubnetDto,
  UpdateSubnetDto,
  CreateAllocationDto,
} from 'src/services/ipam.service';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('ipam')
export class IpamController {
  constructor(
    private readonly ipamService: IpamService,
    private readonly auditService: AuditService,
  ) {}

  @Get('subnets')
  findAllSubnets() {
    return this.ipamService.findAllSubnets();
  }

  @Get('subnets/:id')
  findSubnet(@Param('id') id: string) {
    return this.ipamService.findSubnet(id);
  }

  @Get('subnets/:id/utilization')
  getUtilization(@Param('id') id: string) {
    return this.ipamService.getSubnetUtilization(id);
  }

  @Get('subnets/:id/scan-candidates')
  getScanCandidates(@Param('id') id: string) {
    return this.ipamService.findScanCandidates(id);
  }

  @RequiresPermission('devices.connection.manage')
  @Post('subnets')
  async createSubnet(@Body() dto: CreateSubnetDto) {
    const subnet = await this.ipamService.createSubnet(dto);
    await this.auditService.log('SUBNET', subnet.id, 'CREATED', {
      name: subnet.name,
      cidr: subnet.cidr,
    });
    return subnet;
  }

  @RequiresPermission('devices.connection.manage')
  @Patch('subnets/:id')
  async updateSubnet(@Param('id') id: string, @Body() dto: UpdateSubnetDto) {
    const subnet = await this.ipamService.updateSubnet(id, dto);
    await this.auditService.log('SUBNET', id, 'UPDATED', dto);
    return subnet;
  }

  @RequiresPermission('devices.connection.manage')
  @Delete('subnets/:id')
  async removeSubnet(@Param('id') id: string) {
    await this.ipamService.removeSubnet(id);
    await this.auditService.log('SUBNET', id, 'DELETED', {});
    return { ok: true };
  }

  @Get('allocations')
  listAllocations(@Query('subnetId') subnetId?: string) {
    return this.ipamService.listAllocations(subnetId);
  }

  @RequiresPermission('devices.connection.manage')
  @Post('allocations')
  async createAllocation(@Body() dto: CreateAllocationDto) {
    const allocation = await this.ipamService.createAllocation(dto);
    await this.auditService.log('IP_ALLOCATION', allocation.id, 'CREATED', {
      ip: allocation.ip,
      status: allocation.status,
    });
    return allocation;
  }

  @RequiresPermission('devices.connection.manage')
  @Delete('allocations/:id')
  async removeAllocation(@Param('id') id: string) {
    await this.ipamService.removeAllocation(id);
    await this.auditService.log('IP_ALLOCATION', id, 'DELETED', {});
    return { ok: true };
  }

  @Get('conflicts')
  getConflicts() {
    return this.ipamService.getConflicts();
  }
}
