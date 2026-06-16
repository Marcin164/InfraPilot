import { Body, Controller, Delete, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { M365Service } from 'src/services/m365.service';

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
  async saveConfig(@Body() body: any) {
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

  @Get('/users')
  async getUsers() {
    return this.m365.getUsersWithLicenses();
  }

  @Post('/users/:id/assign')
  async assignLicense(@Param('id') id: string, @Body() body: { skuId: string }) {
    await this.m365.assignLicense(id, body.skuId);
    return { success: true };
  }

  @Post('/users/:id/remove')
  async removeLicense(@Param('id') id: string, @Body() body: { skuId: string }) {
    await this.m365.removeLicense(id, body.skuId);
    return { success: true };
  }

  @Get('/sync/status')
  async getSyncStatus() {
    return this.m365.getSyncStatus();
  }

  @Post('/sync/users')
  async syncUsers() {
    return this.m365.syncUsers();
  }

  @Post('/sync/devices')
  async syncDevices() {
    return this.m365.syncDeviceCompliance();
  }
}
