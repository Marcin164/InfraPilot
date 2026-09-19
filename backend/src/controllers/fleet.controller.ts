import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { FleetService } from 'src/services/fleet.service';

@UseGuards(AuthGuard, MfaGuard)
@RequiresPermission(
  'audit.fullAccess',
  'devices.complianceRules.manage',
  'devices.view',
)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleet: FleetService) {}

  @Get('overview')
  overview() {
    return this.fleet.overview();
  }

  @Get('stale-agents')
  staleAgents(@Query('hours') hours?: string) {
    const parsed = hours ? Number(hours) : undefined;
    return this.fleet.staleAgents(Number.isFinite(parsed) ? parsed : undefined);
  }
}
