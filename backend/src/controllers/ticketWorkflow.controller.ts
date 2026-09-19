import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  TicketWorkflowService,
  UpsertCategoryDto,
  UpsertWorkflowDto,
} from 'src/services/ticketWorkflow.service';

@UseGuards(AuthGuard)
@RequiresPermission('helpdesk.workflow.config', 'audit.fullAccess')
@Controller('ticket-workflows')
export class TicketWorkflowController {
  constructor(private readonly service: TicketWorkflowService) {}

  // ---- Categories ----

  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @RequiresPermission('helpdesk.workflow.config')
  @Put('categories')
  upsertCategory(@Body() body: UpsertCategoryDto) {
    return this.service.upsertCategory(body);
  }

  @RequiresPermission('helpdesk.workflow.config')
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

  @RequiresPermission('helpdesk.workflow.config')
  @Put()
  upsertWorkflow(@Body() body: UpsertWorkflowDto, @Req() req: any) {
    const actorId =
      req?.user?.properties?.metadata?.id ?? req?.user?.id ?? 'unknown';
    return this.service.upsertWorkflow(body, actorId);
  }

  @RequiresPermission('helpdesk.workflow.config')
  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string) {
    await this.service.deleteWorkflow(id);
    return { ok: true };
  }

  // ---- Step attachments (template file for the `add_attachment` step) ----

  @RequiresPermission('helpdesk.workflow.config')
  @Post('steps/attachment')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async uploadStepAttachment(@UploadedFile() file: any) {
    return this.service.uploadStepAttachment(file);
  }
}
