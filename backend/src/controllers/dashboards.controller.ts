import {
  Controller,
  Get,
  Req,
  Param,
  UseGuards,
  Post,
  Patch,
  Delete,
  Body,
} from '@nestjs/common';
import { Request } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { DashboardsService } from 'src/services/dashboards.service';
import {
  CreateDashboardDto,
  UpdateDashboardCardsDto,
} from 'src/dto/dashboards.dto';

@UseGuards(AuthGuard)
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get()
  async findAll(@Req() req: Request): Promise<any> {
    return this.dashboardsService.findAll();
  }

  @RequiresPermission('dashboards.edit')
  @Post()
  create(@Body() body: CreateDashboardDto) {
    return this.dashboardsService.createDashboard(body.name, body.userId);
  }

  @RequiresPermission('dashboards.edit')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.dashboardsService.deleteDashboard(id);
  }

  @RequiresPermission('dashboards.edit')
  @Patch(':id')
  updateCards(@Param('id') id: string, @Body() body: UpdateDashboardCardsDto) {
    return this.dashboardsService.updateCards(id, body.cards);
  }
}
