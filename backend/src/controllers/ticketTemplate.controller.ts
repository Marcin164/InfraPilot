import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  TicketTemplateService,
  CreateTicketTemplateDto,
  UpdateTicketTemplateDto,
} from 'src/services/ticketTemplate.service';

const actorOf = (req: any): string =>
  req?.user?.properties?.metadata?.id ?? req?.user?.id ?? 'unknown';

@UseGuards(AuthGuard)
@RequiresPermission('helpdesk.ticketTemplates.manage', 'audit.fullAccess')
@Controller('ticket-templates')
export class TicketTemplateController {
  constructor(private readonly service: TicketTemplateService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.listForUser(actorOf(req));
  }

  @RequiresPermission('helpdesk.ticketTemplates.manage')
  @Post()
  create(@Body() body: CreateTicketTemplateDto, @Req() req: any) {
    return this.service.create(body, actorOf(req));
  }

  @RequiresPermission('helpdesk.ticketTemplates.manage')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() patch: UpdateTicketTemplateDto,
    @Req() req: any,
  ) {
    return this.service.update(id, patch, actorOf(req));
  }

  @RequiresPermission('helpdesk.ticketTemplates.manage')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.service.remove(id, actorOf(req));
    return { ok: true };
  }
}
