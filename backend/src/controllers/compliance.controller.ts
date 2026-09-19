import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  ComplianceService,
  UpsertComplianceRuleDto,
} from 'src/services/compliance.service';

@UseGuards(AuthGuard, MfaGuard)
@RequiresPermission(
  'devices.complianceRules.manage',
  'audit.fullAccess',
  'devices.view',
)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Get('rules')
  listRules() {
    return this.service.listRules();
  }

  @RequiresPermission('devices.complianceRules.manage')
  @Put('rules/:key')
  upsertRule(@Param('key') key: string, @Body() body: UpsertComplianceRuleDto) {
    return this.service.upsertRule({ ...body, key });
  }

  @RequiresPermission('devices.complianceRules.manage')
  @Delete('rules/:key')
  async deleteRule(@Param('key') key: string) {
    await this.service.deleteRule(key);
    return { ok: true };
  }

  @Get('device/:deviceId')
  forDevice(@Param('deviceId') deviceId: string) {
    return this.service.resultsForDevice(deviceId);
  }

  @RequiresPermission('devices.complianceRules.manage')
  @Post('device/:deviceId/evaluate')
  evaluate(@Param('deviceId') deviceId: string) {
    return this.service.evaluateDevice(deviceId);
  }

  @Get('summary')
  summary() {
    return this.service.summary();
  }
}
