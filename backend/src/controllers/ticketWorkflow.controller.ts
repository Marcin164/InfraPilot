import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { TicketWorkflowService } from 'src/services/ticketWorkflow.service';

@UseGuards(AuthGuard)
@Roles(Role.Admin, Role.Helpdesk, Role.Auditor)
@Controller('ticket-workflows')
export class TicketWorkflowController {
  constructor(private readonly service: TicketWorkflowService) {}

  // ---- Categories ----

  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Roles(Role.Admin, Role.Helpdesk)
  @Put('categories')
  upsertCategory(@Body() body: any) {
    return this.service.upsertCategory(body);
  }

  @Roles(Role.Admin, Role.Helpdesk)
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.service.deleteCategory(id);
    return { ok: true };
  }

  // ---- Workflows ----

  @Get()
  listWorkflows() {
    return this.service.listWorkflows();
  }

  @Get(':id')
  getWorkflow(@Param('id') id: string) {
    return this.service.getWorkflow(id);
  }

  @Roles(Role.Admin, Role.Helpdesk)
  @Put()
  upsertWorkflow(@Body() body: any, @Req() req: any) {
    const actorId =
      req?.user?.properties?.metadata?.id ?? req?.user?.id ?? 'unknown';
    return this.service.upsertWorkflow(body, actorId);
  }

  @Roles(Role.Admin, Role.Helpdesk)
  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string) {
    await this.service.deleteWorkflow(id);
    return { ok: true };
  }
}
