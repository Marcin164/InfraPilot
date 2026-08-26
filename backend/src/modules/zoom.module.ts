import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { ZoomService } from 'src/services/zoom.service';
import { ZoomController } from 'src/controllers/zoom.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings, SoftwareLicense])],
  controllers: [ZoomController],
  providers: [ZoomService],
  exports: [ZoomService],
})
export class ZoomModule {}
