import { Module } from '@nestjs/common';
import { M365Module } from './m365.module';
import { GoogleWorkspaceModule } from './googleWorkspace.module';
import { LicenseSyncWorker } from 'src/workers/licenseSync.worker';

@Module({
  imports: [M365Module, GoogleWorkspaceModule],
  providers: [LicenseSyncWorker],
})
export class LicenseSyncModule {}
