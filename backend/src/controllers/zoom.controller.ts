import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { ZoomService } from 'src/services/zoom.service';
import { SaveZoomConfigDto } from 'src/dto/zoom.dto';
import { describeZoomError } from 'src/helpers/describeZoomError';

@UseGuards(AuthGuard, MfaGuard)
@RequiresPermission('licenses.integrations.manage')
@Controller('zoom')
export class ZoomController {
  constructor(private readonly zoom: ZoomService) {}

  @Get('/config')
  async getConfig() {
    const cfg = await this.zoom.getPublicConfig();
    return cfg ?? { accountId: '', clientId: '', hasSecret: false };
  }

  @Post('/config')
  async saveConfig(@Body() body: SaveZoomConfigDto) {
    await this.zoom.saveConfig(body);
    return { success: true, message: 'Konfiguracja Zoom zapisana' };
  }

  @Delete('/config')
  async deleteConfig() {
    await this.zoom.deleteConfig();
    return { success: true, message: 'Konfiguracja Zoom usunięta' };
  }

  @Post('/test')
  async testConnection() {
    return this.zoom.testConnection();
  }

  @Get('/sync/status')
  async getSyncStatus() {
    return this.zoom.getSyncStatus();
  }

  @Post('/sync/licenses')
  async syncLicenses() {
    try {
      return await this.zoom.syncLicenses();
    } catch (err: any) {
      throw new BadRequestException(describeZoomError(err));
    }
  }
}
