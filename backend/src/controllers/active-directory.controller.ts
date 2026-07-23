import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { MfaGuard } from 'src/guards/mfaGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import {
  ActiveDirectoryService,
  AdConnectDto,
  AdDisconnectDto,
} from 'src/services/active-directory.service';
import { UsersService } from 'src/services/users.service';
import { describeAdError } from 'src/helpers/adErrorMessage';

@UseGuards(AuthGuard, MfaGuard)
@Roles(Role.Admin)
@Controller('active-directory')
export class ActiveDirectoryController {
  constructor(
    private readonly adService: ActiveDirectoryService,
    private readonly usersService: UsersService,
  ) {}

  @Get('/status')
  async getStatus() {
    return this.adService.getStatus();
  }

  @Post('/connect')
  async connect(@Body() config: AdConnectDto) {
    return this.adService.connect(config);
  }

  @Post('/disconnect')
  async disconnect(@Body() body: AdDisconnectDto) {
    return this.adService.disconnect(body?.password);
  }

  @Post('/test')
  async testConnection(@Body() config: AdConnectDto) {
    return this.adService.testConnection(config);
  }

  @Post('/sync')
  async sync() {
    try {
      const users = await this.adService.findAllUsers();
      await this.usersService.insertManyUsersAD(users);
      await this.adService.saveSyncInfo(users.length);
      return {
        success: true,
        message: `Zsynchronizowano ${users.length} użytkowników`,
        usersCount: users.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Synchronizacja nieudana: ${describeAdError(error)}`,
      };
    }
  }

  @Post('/certificate')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async uploadCertificate(@UploadedFile() file: any) {
    if (!file) {
      return { success: false, message: 'Nie przesłano pliku' };
    }
    return this.adService.uploadCertificate(file.buffer);
  }

  @Delete('/certificate')
  async deleteCertificate() {
    return this.adService.deleteCertificate();
  }
}
