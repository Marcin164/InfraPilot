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
import { Role, Roles } from 'src/decorators/roles.decorator';
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

  @Roles(Role.Admin)
  @Post('subnets')
  async createSubnet(@Body() dto: CreateSubnetDto) {
    const subnet = await this.ipamService.createSubnet(dto);
    await this.auditService.log('SUBNET', subnet.id, 'CREATED', { name: subnet.name, cidr: subnet.cidr });
    return subnet;
  }

  @Roles(Role.Admin)
  @Patch('subnets/:id')
  async updateSubnet(@Param('id') id: string, @Body() dto: UpdateSubnetDto) {
    const subnet = await this.ipamService.updateSubnet(id, dto);
    await this.auditService.log('SUBNET', id, 'UPDATED', dto);
    return subnet;
  }

  @Roles(Role.Admin)
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

  @Roles(Role.Admin)
  @Post('allocations')
  async createAllocation(@Body() dto: CreateAllocationDto) {
    const allocation = await this.ipamService.createAllocation(dto);
    await this.auditService.log('IP_ALLOCATION', allocation.id, 'CREATED', {
      ip: allocation.ip,
      status: allocation.status,
    });
    return allocation;
  }

  @Roles(Role.Admin)
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
