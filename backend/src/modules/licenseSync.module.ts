import { Module } from '@nestjs/common';
import { M365Module } from './m365.module';
import { GoogleWorkspaceModule } from './googleWorkspace.module';
import { GithubEnterpriseModule } from './githubEnterprise.module';
import { ZoomModule } from './zoom.module';
import { DropboxModule } from './dropbox.module';
import { AdobeModule } from './adobe.module';
import { LicenseSyncWorker } from 'src/workers/licenseSync.worker';

@Module({
  imports: [M365Module, GoogleWorkspaceModule, GithubEnterpriseModule, ZoomModule, DropboxModule, AdobeModule],
  providers: [LicenseSyncWorker],
})
export class LicenseSyncModule {}
