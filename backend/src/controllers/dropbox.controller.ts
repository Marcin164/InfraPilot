import { BadRequestException, Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { DropboxService } from 'src/services/dropbox.service';
import { SaveDropboxConfigDto } from 'src/dto/dropbox.dto';
import { describeDropboxError } from 'src/helpers/describeDropboxError';

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin)
@Controller('dropbox')
export class DropboxController {
  constructor(private readonly dropbox: DropboxService) {}

  @Get('/config')
  async getConfig() {
    const cfg = await this.dropbox.getPublicConfig();
    return cfg ?? { appKey: '', hasSecret: false, hasRefreshToken: false };
  }

  @Post('/config')
  async saveConfig(@Body() body: SaveDropboxConfigDto) {
    await this.dropbox.saveConfig(body);
    return { success: true, message: 'Konfiguracja Dropbox zapisana' };
  }

  @Delete('/config')
  async deleteConfig() {
    await this.dropbox.deleteConfig();
    return { success: true, message: 'Konfiguracja Dropbox usunięta' };
  }

  @Post('/test')
  async testConnection() {
    return this.dropbox.testConnection();
  }

  @Get('/sync/status')
  async getSyncStatus() {
    return this.dropbox.getSyncStatus();
  }

  @Post('/sync/licenses')
  async syncLicenses() {
    try {
      return await this.dropbox.syncLicenses();
    } catch (err: any) {
      throw new BadRequestException(describeDropboxError(err));
    }
  }
}
