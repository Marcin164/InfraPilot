import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { AiService } from 'src/services/ai.service';

class TicketAssistDto {
  description: string;
  category?: string;
  deviceInfo?: string;
}

class AnalyzeLogsDto {
  logs: any;
  description?: string;
}

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ticket-assist')
  ticketAssist(@Body() dto: TicketAssistDto) {
    return this.aiService.assistTicket(
      dto.description,
      dto.category,
      dto.deviceInfo,
    );
  }

  @Post('analyze-logs')
  analyzeLogs(@Body() dto: AnalyzeLogsDto) {
    return this.aiService.analyzeLogs(dto.logs, dto.description);
  }
}
