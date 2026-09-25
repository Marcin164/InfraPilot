import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { Request } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  HistoriesService,
  type HistoryFeedQuery,
} from 'src/services/histories.service';
import { CreateHistoryDto } from 'src/dto/history.dto';

@UseGuards(AuthGuard)
@Controller('histories')
export class HistoriesController {
  constructor(private readonly historiesService: HistoriesService) {}

  // Same audience as feed/feed-export below -- an unscoped dump of every
  // history entry company-wide is exactly the kind of thing those two are
  // already gated against, just without the filtering.
  @RequiresPermission('audit.fullAccess', 'helpdesk.approver', 'dpo.fullAccess')
  @Get()
  async findAll(@Req() req: Request): Promise<any> {
    return this.historiesService.findAll();
  }

  @RequiresPermission('audit.fullAccess', 'helpdesk.approver', 'dpo.fullAccess')
  @Get('feed')
  async findFeed(@Query() query: HistoryFeedQuery): Promise<any> {
    return this.historiesService.findFeed(query);
  }

  @RequiresPermission('audit.fullAccess', 'helpdesk.approver', 'dpo.fullAccess')
  @Get('feed/export')
  async exportFeed(
    @Query() query: HistoryFeedQuery,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, csv } = await this.historiesService.exportFeedCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @RequiresPermission('helpdesk.tickets.access')
  @Post()
  async createHistory(@Body() body: CreateHistoryDto): Promise<any> {
    return this.historiesService.createHistory(body);
  }

  @RequiresPermission('devices.view')
  @Get('device/:deviceId')
  async findDeviceHistory(@Param('deviceId') deviceId: string): Promise<any> {
    return this.historiesService.findDeviceHistory(deviceId);
  }

  @RequiresPermission('users.view')
  @Get('user/:userId')
  async findUserHistory(@Param('userId') userId: string): Promise<any> {
    return this.historiesService.findUserHistory(userId);
  }
}
