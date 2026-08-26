import { BadRequestException, Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { AdobeService } from 'src/services/adobe.service';
import { SaveAdobeConfigDto } from 'src/dto/adobe.dto';
import { describeAdobeError } from 'src/helpers/describeAdobeError';

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin)
@Controller('adobe')
export class AdobeController {
  constructor(private readonly adobe: AdobeService) {}

  @Get('/config')
  async getConfig() {
    const cfg = await this.adobe.getPublicConfig();
    return cfg ?? { orgId: '', clientId: '', hasSecret: false, profiles: [] };
  }

  @Post('/config')
  async saveConfig(@Body() body: SaveAdobeConfigDto) {
    await this.adobe.saveConfig(body);
    return { success: true, message: 'Konfiguracja Adobe zapisana' };
  }

  @Delete('/config')
  async deleteConfig() {
    await this.adobe.deleteConfig();
    return { success: true, message: 'Konfiguracja Adobe usunięta' };
  }

  @Post('/test')
  async testConnection() {
    return this.adobe.testConnection();
  }

  @Get('/sync/status')
  async getSyncStatus() {
    return this.adobe.getSyncStatus();
  }

  @Post('/sync/licenses')
  async syncLicenses() {
    try {
      return await this.adobe.syncLicenses();
    } catch (err: any) {
      throw new BadRequestException(describeAdobeError(err));
    }
  }
}
