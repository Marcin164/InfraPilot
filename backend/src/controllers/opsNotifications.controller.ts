import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { OpsNotificationsService } from 'src/services/opsNotifications.service';
import { SaveOpsNotificationConfigDto } from 'src/dto/opsNotifications.dto';

@UseGuards(AuthGuard, MfaGuard)
@RequiresPermission('admin.opsAlertEmails.config')
@Controller('ops-notifications')
export class OpsNotificationsController {
  constructor(private readonly service: OpsNotificationsService) {}

  @Get('/config')
  async getConfig() {
    return this.service.getConfig();
  }

  @Post('/config')
  async saveConfig(@Body() body: SaveOpsNotificationConfigDto) {
    await this.service.saveConfig(body);
    return { success: true };
  }
}
