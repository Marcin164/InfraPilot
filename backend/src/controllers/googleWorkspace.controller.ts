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
import { GoogleWorkspaceService } from 'src/services/googleWorkspace.service';
import { SaveGoogleWorkspaceConfigDto } from 'src/dto/googleWorkspace.dto';
import { describeGoogleError } from 'src/helpers/describeGoogleError';

@UseGuards(AuthGuard, MfaGuard)
@RequiresPermission('licenses.integrations.manage')
@Controller('google-workspace')
export class GoogleWorkspaceController {
  constructor(private readonly google: GoogleWorkspaceService) {}

  @Get('/config')
  async getConfig() {
    const cfg = await this.google.getPublicConfig();
    return cfg ?? { adminEmail: '', hasServiceAccount: false, skus: [] };
  }

  @Post('/config')
  async saveConfig(@Body() body: SaveGoogleWorkspaceConfigDto) {
    await this.google.saveConfig(body);
    return { success: true, message: 'Konfiguracja Google Workspace zapisana' };
  }

  @Delete('/config')
  async deleteConfig() {
    await this.google.deleteConfig();
    return { success: true, message: 'Konfiguracja Google Workspace usunięta' };
  }

  @Post('/test')
  async testConnection() {
    return this.google.testConnection();
  }

  @Get('/sync/status')
  async getSyncStatus() {
    return this.google.getSyncStatus();
  }

  @Post('/sync/licenses')
  async syncLicenses() {
    try {
      return await this.google.syncLicenses();
    } catch (err: any) {
      throw new BadRequestException(describeGoogleError(err));
    }
  }
}
