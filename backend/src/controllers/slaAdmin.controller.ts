import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { SlaAdminService } from 'src/services/slaAdmin.service';

@UseGuards(AuthGuard)
@RequiresPermission('devices.complianceRules.manage', 'audit.fullAccess')
@Controller('sla/admin')
export class SlaAdminController {
  constructor(private readonly adminService: SlaAdminService) {}

  // 📊 aktywne SLA
  @Get('active')
  getActive() {
    return this.adminService.getActive();
  }

  // 🚨 breached SLA
  @Get('breaches')
  getBreaches() {
    return this.adminService.getBreaches();
  }
}
