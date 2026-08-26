import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { SoftwareLicense } from 'src/entities/softwareLicense.entity';
import { AdobeService } from 'src/services/adobe.service';
import { AdobeController } from 'src/controllers/adobe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings, SoftwareLicense])],
  controllers: [AdobeController],
  providers: [AdobeService],
  exports: [AdobeService],
})
export class AdobeModule {}
