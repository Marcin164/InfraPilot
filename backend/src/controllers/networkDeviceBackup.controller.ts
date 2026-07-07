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
import { Role, Roles } from 'src/decorators/roles.decorator';
import {
  NetworkDeviceBackupService,
  SetCredentialDto,
  SetLeaseSyncDto,
} from 'src/services/networkDeviceBackup.service';
import { LeaseSyncService } from 'src/services/leaseSync.service';

@UseGuards(AuthGuard)
@Roles(Role.Admin)
@Controller('devices')
export class NetworkDeviceBackupController {
  constructor(
    private readonly backupService: NetworkDeviceBackupService,
    private readonly leaseSyncService: LeaseSyncService,
  ) {}

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

  @Put('/:deviceId/lease-sync')
  setLeaseSync(
    @Param('deviceId') deviceId: string,
    @Body() dto: SetLeaseSyncDto,
    @Req() req: any,
  ) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    return this.backupService.setLeaseSync(deviceId, dto, actor);
  }

  @Post('/:deviceId/lease-sync/run')
  runLeaseSync(@Param('deviceId') deviceId: string, @Req() req: any) {
    const actor = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    return this.leaseSyncService.runSync(deviceId, actor);
  }
}
