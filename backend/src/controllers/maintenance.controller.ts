import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { MaintenanceService, CreateMaintenanceDto, UpdateMaintenanceDto } from 'src/services/maintenance.service';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly auditService: AuditService,
  ) {}

  @Get('device/:deviceId')
  findByDevice(@Param('deviceId') deviceId: string) {
    return this.maintenanceService.findByDevice(deviceId);
  }

  @Get('upcoming')
  findUpcoming() {
    return this.maintenanceService.findUpcoming(30);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Roles(Role.Admin)
  @Post()
  async create(@Body() dto: CreateMaintenanceDto) {
    const record = await this.maintenanceService.create(dto);
    await this.auditService.log('Maintenance', record.id, 'CREATED', { deviceId: record.deviceId, type: record.type });
    return record;
  }

  @Roles(Role.Admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
    const record = await this.maintenanceService.update(id, dto);
    await this.auditService.log('Maintenance', id, 'UPDATED', dto);
    return record;
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.maintenanceService.remove(id);
    await this.auditService.log('Maintenance', id, 'DELETED', {});
    return { ok: true };
  }
}
