import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { SmtpSettingsService } from 'src/services/smtp-settings.service';
import { MailService } from 'src/services/mail.service';

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin)
@Controller('smtp')
export class SmtpController {
  constructor(
    private readonly smtpSettings: SmtpSettingsService,
    private readonly mailService: MailService,
  ) {}

  @Get('/config')
  async getConfig() {
    const cfg = await this.smtpSettings.getPublicConfig();
    return cfg ?? { host: '', port: 587, secure: false, user: '', from: '', hasPass: false };
  }

  @Post('/config')
  async saveConfig(@Body() body: any) {
    await this.smtpSettings.saveConfig(body);
    await this.mailService.reinit();
    return { success: true, message: 'Konfiguracja SMTP zapisana' };
  }

  @Delete('/config')
  async deleteConfig() {
    await this.smtpSettings.deleteConfig();
    await this.mailService.reinit();
    return { success: true, message: 'Konfiguracja SMTP usunięta — przywrócono ustawienia z .env' };
  }

  @Post('/test')
  async testConnection(@Body() body: any) {
    return this.smtpSettings.testConnection(body);
  }
}
