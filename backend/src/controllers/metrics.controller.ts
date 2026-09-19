import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';

// Replaces PrometheusModule's default (unauthenticated) /metrics controller.
// Route path is attached by PrometheusModule.register() via Reflect
// metadata, so no path is declared here — see PrometheusModule.register in
// app.module.ts.
@UseGuards(AuthGuard)
@RequiresPermission('audit.fullAccess')
@Controller()
export class MetricsController extends PrometheusController {
  @Get()
  index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
