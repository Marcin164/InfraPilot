import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { OpsNotificationsService } from 'src/services/opsNotifications.service';
import { SaveOpsNotificationConfigDto } from 'src/dto/opsNotifications.dto';

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin)
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
