import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { GoogleWorkspaceService } from 'src/services/googleWorkspace.service';
import { GoogleWorkspaceController } from 'src/controllers/googleWorkspace.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings, SoftwareLicense])],
  controllers: [GoogleWorkspaceController],
  providers: [GoogleWorkspaceService],
  exports: [GoogleWorkspaceService],
})
export class GoogleWorkspaceModule {}
