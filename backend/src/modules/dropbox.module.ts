import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { DropboxService } from 'src/services/dropbox.service';
import { DropboxController } from 'src/controllers/dropbox.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings, SoftwareLicense])],
  controllers: [DropboxController],
  providers: [DropboxService],
  exports: [DropboxService],
})
export class DropboxModule {}
