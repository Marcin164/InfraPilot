import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { AiController } from 'src/controllers/ai.controller';
import { AiService } from 'src/services/ai.service';
import { AiSettingsService } from 'src/services/aiSettings.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSettings])],
  controllers: [AiController],
  providers: [AiService, AiSettingsService],
  exports: [AiService, AiSettingsService],
})
export class AiModule {}
