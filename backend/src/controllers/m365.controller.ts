import { BadRequestException, Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { M365Service } from 'src/services/m365.service';
import { SaveM365ConfigDto } from 'src/dto/m365.dto';
import { describeGraphError } from 'src/helpers/graphErrorMessage';

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin)
@Controller('m365')
export class M365Controller {
  constructor(private readonly m365: M365Service) {}

  @Get('/config')
  async getConfig() {
    const cfg = await this.m365.getPublicConfig();
    return cfg ?? { tenantId: '', clientId: '', hasSecret: false };
  }

  @Post('/config')
  async saveConfig(@Body() body: SaveM365ConfigDto) {
    await this.m365.saveConfig(body);
    return { success: true, message: 'Konfiguracja Microsoft 365 zapisana' };
  }

  @Delete('/config')
  async deleteConfig() {
    await this.m365.deleteConfig();
    return { success: true, message: 'Konfiguracja Microsoft 365 usunięta' };
  }

  @Post('/test')
  async testConnection() {
    return this.m365.testConnection();
  }

  @Get('/skus')
  async getSkus() {
    return this.m365.getSubscribedSkus();
  }

  @Get('/sync/status')
  async getSyncStatus() {
    return this.m365.getSyncStatus();
  }

  @Post('/sync/users')
  async syncUsers() {
    try {
      return await this.m365.syncUsers();
    } catch (err: any) {
      throw new BadRequestException(describeGraphError(err));
    }
  }

  @Post('/sync/devices')
  async syncDevices() {
    try {
      return await this.m365.syncDeviceCompliance();
    } catch (err: any) {
      throw new BadRequestException(describeGraphError(err));
    }
  }
}
