import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
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

// Both endpoints are only ever called from Helpdesk's ticket diagnostics
// panel (TicketDiagnostics.tsx), which already lives behind a
// helpdesk.tickets.access-gated page -- gate the API the same way so it
// can't be hit directly by any authenticated user regardless of role.
@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @RequiresPermission('helpdesk.tickets.access')
  @Post('ticket-assist')
  ticketAssist(@Body() dto: TicketAssistDto) {
    return this.aiService.assistTicket(
      dto.description,
      dto.category,
      dto.deviceInfo,
    );
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Post('analyze-logs')
  analyzeLogs(@Body() dto: AnalyzeLogsDto) {
    return this.aiService.analyzeLogs(dto.logs, dto.description);
  }
}
