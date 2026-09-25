import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  NetworkDeviceBackupService,
  SetCredentialDto,
} from 'src/services/networkDeviceBackup.service';

@UseGuards(AuthGuard)
@RequiresPermission('devices.networkBackup.manage')
@Controller('devices')
export class NetworkDeviceBackupController {
  constructor(private readonly backupService: NetworkDeviceBackupService) {}

  @Get('/:deviceId/ssh-credential')
  getCredential(@Param('deviceId') deviceId: string) {
    return this.backupService.getCredentialPublic(deviceId);
  }

  @Put('/:deviceId/ssh-credential')
  setCredential(
    @Param('deviceId') deviceId: string,
    @Body() dto: SetCredentialDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    return this.backupService.setCredential(deviceId, dto, actor);
  }

  @Post('/:deviceId/backup/run')
  runBackup(@Param('deviceId') deviceId: string, @Req() req: any) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    return this.backupService.runBackup(deviceId, actor);
  }

  @Get('/:deviceId/backups')
  listBackups(@Param('deviceId') deviceId: string) {
    return this.backupService.listBackups(deviceId);
  }

  @Get('/:deviceId/backups/:backupId')
  getBackup(
    @Param('deviceId') deviceId: string,
    @Param('backupId') backupId: string,
  ) {
    return this.backupService.getBackup(deviceId, backupId);
  }
}
