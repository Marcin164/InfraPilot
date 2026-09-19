import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { CveService } from 'src/services/cve.service';

@UseGuards(AuthGuard, MfaGuard)
@RequiresPermission(
  'audit.fullAccess',
  'devices.complianceRules.manage',
  'devices.view',
)
@Controller('cve')
export class CveController {
  constructor(private readonly cveService: CveService) {}

  @Get('summary')
  summary() {
    return this.cveService.summary();
  }

  @Get('device/:deviceId')
  forDevice(@Param('deviceId') deviceId: string) {
    return this.cveService.forDevice(deviceId);
  }

  /**
   * Manual trigger for the CVE sweep. Same code the nightly worker runs.
   */
  @RequiresPermission('devices.complianceRules.manage')
  @Post('reconcile')
  reconcile() {
    return this.cveService.reconcile();
  }
}
