import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { AiService } from 'src/services/ai.service';
import {
  AiSettingsService,
  AiSurface,
  ALL_AI_SURFACES,
} from 'src/services/aiSettings.service';

export class TicketAssistDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  deviceInfo?: string;

  // Which caller is asking -- Settings > AI's per-surface toggles need to
  // know whether to check adminTicketAssist or userTicketAssist, since both
  // AIAssistPanel.tsx (existing ticket, staff) and New.tsx's
  // TicketAssistHelper (draft ticket, any requester) hit this same endpoint.
  @IsIn(['adminTicketAssist', 'userTicketAssist'])
  surface: 'adminTicketAssist' | 'userTicketAssist';
}

export class AnalyzeLogsDto {
  // Raw diagnostic payload from the agent (collect_event_log task result) --
  // TicketDiagnostics.tsx always sends the task's JSON `result` object, but
  // AiService.analyzeLogs() also accepts a preformatted string, so this is
  // deliberately untyped rather than @IsObject()-only. @IsDefined() is the
  // loosest decorator that still registers the property with class-validator
  // -- without at least one decorator here, the global ValidationPipe's
  // whitelist/forbidNonWhitelisted config (main.ts) treats every field on
  // this DTO as unknown and rejects the request with 400 before it ever
  // reaches the service.
  @IsDefined()
  logs: any;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateAiSettingsDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsArray()
  @IsIn(ALL_AI_SURFACES, { each: true })
  enabledSurfaces?: AiSurface[];

  // Target KnowledgeSpace for TicketClosureSummaryListener's drafts. '' (or
  // omitted) means "auto" -- the listener creates/reuses a default space and
  // writes its id back here on first use.
  @IsOptional()
  @IsString()
  knowledgeSpaceId?: string;
}

// analyze-logs is only ever called from Helpdesk's ticket diagnostics panel
// (TicketDiagnostics.tsx), which already lives behind a
// helpdesk.tickets.access-gated page -- gate the API the same way so it
// can't be hit directly by any authenticated user regardless of role.
//
// ticket-assist is different: it's also used by the end-user portal's "New
// ticket" form (Pages/User/Tickets/New.tsx) to help a requester word their
// own draft ticket before they've even created it, so it can't require
// helpdesk.tickets.access -- there's no ticket yet for that permission to be
// about, and every authenticated user is allowed to write their own ticket
// (POST /tickets itself has no permission gate either, same reasoning).
// Settings > AI's per-surface toggles (see aiSettings.service.ts) are
// re-checked here too, not just hidden in the UI, so a stale page or a
// direct API call can't bypass an admin turning a surface off.
@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiSettings: AiSettingsService,
  ) {}

  @Post('ticket-assist')
  async ticketAssist(@Body() dto: TicketAssistDto) {
    if (!(await this.aiSettings.isSurfaceEnabled(dto.surface))) {
      throw new ForbiddenException(
        'AI ticket assist has been disabled by an administrator',
      );
    }
    return this.aiService.assistTicket(
      dto.description,
      dto.category,
      dto.deviceInfo,
    );
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Post('analyze-logs')
  async analyzeLogs(@Body() dto: AnalyzeLogsDto) {
    if (!(await this.aiSettings.isSurfaceEnabled('logAnalysis'))) {
      throw new ForbiddenException(
        'AI log analysis has been disabled by an administrator',
      );
    }
    return this.aiService.analyzeLogs(dto.logs, dto.description);
  }

  // Readable by any authenticated user (no @RequiresPermission) -- both the
  // admin Helpdesk panels and the end-user "New ticket" form need to know
  // whether their own surface is enabled before deciding to render their AI
  // button at all. Nothing sensitive lives in this config (just a model name
  // and on/off flags), so this is safe to expose broadly.
  @Get('settings')
  getSettings() {
    return this.aiSettings.getConfig();
  }

  @RequiresPermission('admin.ai.config')
  @Put('settings')
  saveSettings(@Body() dto: UpdateAiSettingsDto) {
    return this.aiSettings.saveConfig(dto);
  }
}
