import { BadRequestException, Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { GithubEnterpriseService } from 'src/services/githubEnterprise.service';
import { SaveGithubConfigDto } from 'src/dto/githubEnterprise.dto';
import { describeGithubError } from 'src/helpers/describeGithubError';

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin)
@Controller('github')
export class GithubEnterpriseController {
  constructor(private readonly github: GithubEnterpriseService) {}

  @Get('/config')
  async getConfig() {
    const cfg = await this.github.getPublicConfig();
    return cfg ?? { enterpriseSlug: '', hasToken: false };
  }

  @Post('/config')
  async saveConfig(@Body() body: SaveGithubConfigDto) {
    await this.github.saveConfig(body);
    return { success: true, message: 'Konfiguracja GitHub Enterprise zapisana' };
  }

  @Delete('/config')
  async deleteConfig() {
    await this.github.deleteConfig();
    return { success: true, message: 'Konfiguracja GitHub Enterprise usunięta' };
  }

  @Post('/test')
  async testConnection() {
    return this.github.testConnection();
  }

  @Get('/sync/status')
  async getSyncStatus() {
    return this.github.getSyncStatus();
  }

  @Post('/sync/licenses')
  async syncLicenses() {
    try {
      return await this.github.syncLicenses();
    } catch (err: any) {
      throw new BadRequestException(describeGithubError(err));
    }
  }
}
