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
import { Role, Roles } from 'src/decorators/roles.decorator';
import { DashboardsService } from 'src/services/dashboards.service';

@UseGuards(AuthGuard)
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get()
  async findAll(@Req() req: Request): Promise<any> {
    return this.dashboardsService.findAll();
  }

  @Roles(Role.Admin)
  @Post()
  create(@Body() body: { name: string; userId: string }) {
    return this.dashboardsService.createDashboard(body.name, body.userId);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.dashboardsService.deleteDashboard(id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  updateCards(@Param('id') id: string, @Body() body: { cards: Record<string, any>[] }) {
    return this.dashboardsService.updateCards(id, body.cards);
  }
}
