import { Module } from '@nestjs/common';
import { AiController } from 'src/controllers/ai.controller';
import { AiService } from 'src/services/ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
