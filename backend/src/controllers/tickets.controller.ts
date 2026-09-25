import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateTicketDto,
  GetTicketsQueryDto,
  UpdateTicketDto,
  CreateCommentDto,
  UpdateTicketCategoriesDto,
  LinkTicketDto,
  UpdateApprovalDto,
} from 'src/dto/tickets.dto';
import { Tickets } from 'src/entities/tickets.entity';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { TicketsService } from 'src/services/tickets.service';

@UseGuards(AuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // The full ticket queue (any requester, filterable) is a staff view --
  // /mine below is the self-scoped equivalent every plain user actually
  // needs.
  @RequiresPermission('helpdesk.tickets.access')
  @Get()
  async getTickets(@Query() query: GetTicketsQueryDto) {
    return this.ticketsService.getTickets(query);
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Get('/filters')
  async getFilters() {
    return this.ticketsService.getFilterOptions();
  }

  @Get('/mine')
  async getMyTickets(
    @Req() req: any,
    @Query('scope') scope: 'open' | 'closed' = 'open',
  ) {
    const userId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.getMyTickets(userId, scope);
  }

  @Get('/categories')
  async getTicketCategories() {
    return this.ticketsService.getTicketCategories();
  }

  @Get('/agent-stats')
  async getAgentStats(@Req() req: any) {
    const userId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.getAgentStats(userId);
  }

  @RequiresPermission('helpdesk.workflow.config')
  @Patch('/categories')
  async updateTicketCategories(@Body() dto: UpdateTicketCategoriesDto) {
    return this.ticketsService.updateTicketCategories(dto);
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Get('/by-requester/:userId')
  async getByRequester(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.ticketsService.getTicketsByRequester(
      userId,
      limit ? Number(limit) : 10,
    );
  }

  // Gated on access to the anchor ticket, not a static permission --
  // otherwise any authenticated user could fish arbitrary tickets'
  // descriptions/categories by probing ids here even without rights to the
  // ticket itself.
  @Get('/:id/similar')
  async getSimilar(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.properties?.metadata?.id;
    await this.ticketsService.assertCanViewTicket(id, userId);
    return this.ticketsService.getSimilarResolvedTickets(
      id,
      limit ? Number(limit) : 5,
    );
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Get('/by-device/:deviceId')
  async getByDevice(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.ticketsService.getTicketsByDevice(
      deviceId,
      limit ? Number(limit) : 10,
    );
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Post(':id/link')
  async linkTicket(
    @Param('id') id: string,
    @Body() body: LinkTicketDto,
    @Req() req: any,
  ) {
    const userId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.linkTicket(id, body.parentTicketId, userId);
  }

  // Self-or-staff, data-dependent (requester/affected-user/staff), not a
  // static permission -- see TicketsService.assertCanViewTicket().
  @Get(':id')
  async getTicket(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?.properties?.metadata?.id;
    await this.ticketsService.assertCanViewTicket(id, userId);
    return this.ticketsService.getTicketById(id, userId);
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Patch(':id')
  async updateTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: any,
  ) {
    const userId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.updateTicket(id, dto, userId);
  }

  @Post()
  async createTicket(@Body() dto: CreateTicketDto): Promise<Tickets> {
    return this.ticketsService.createTicket(dto);
  }

  @Post('/comment/:id/:requesterId')
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ): Promise<any> {
    const authorId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.createComment(id, authorId, dto);
  }

  @Post('/comment/:id/:requesterId/attachment')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async createCommentWithAttachment(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ): Promise<any> {
    const authorId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.createCommentWithAttachment(
      id,
      authorId,
      dto,
      file,
    );
  }

  @Get('/attachment/:commentId')
  async downloadAttachment(
    @Param('commentId') commentId: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const userId = req?.user?.properties?.metadata?.id;
    const { comment, stream } = await this.ticketsService.getAttachmentStream(
      commentId,
      userId,
    );
    res.setHeader(
      'Content-Type',
      comment.attachmentMimetype || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(comment.attachmentName ?? 'attachment')}"`,
    );
    stream.pipe(res);
  }

  @Get('/approve/mine')
  async getMyApprovals(@Req() req: any): Promise<any> {
    const currentUserId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.getMyApprovals(currentUserId);
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Post('/approve/:ticketId/:requesterId/:approverId')
  async createApproval(
    @Param('ticketId') ticketId: string,
    @Param('requesterId') requesterId: string,
    @Param('approverId') approverId: string,
    @Req() req: any,
  ): Promise<any> {
    const currentUserId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.createApproval(
      ticketId,
      requesterId,
      approverId,
      currentUserId,
    );
  }

  @Patch('/approve/:id')
  async updateApproval(
    @Param('id') id: string,
    @Body() dto: UpdateApprovalDto,
    @Req() req: any,
  ): Promise<any> {
    const currentUserId = req?.user?.properties?.metadata?.id;
    return this.ticketsService.updateApproval(id, dto, currentUserId);
  }
}
