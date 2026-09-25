import { Controller, Get, Query, Req, Param, UseGuards } from '@nestjs/common';
import { Request } from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { ApplicationsService } from 'src/services/applications.service';

// Installed-software inventory is device-scoped data -- every current
// consumer (device details' software tab, reports) already lives behind a
// devices.view-gated page. Gate the API the same way.
@UseGuards(AuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @RequiresPermission('devices.view')
  @Get()
  async findAll(@Req() req: Request): Promise<any> {
    return this.applicationsService.findAll();
  }

  @RequiresPermission('devices.view')
  @Get('/table')
  async findAllTable(@Req() req: Request): Promise<any> {
    return this.applicationsService.findAllTable();
  }

  @RequiresPermission('devices.view')
  @Get('/filters')
  async getFilters() {
    return this.applicationsService.getFilterOptions();
  }

  @RequiresPermission('devices.view')
  @Get('/search')
  async search(@Query('q') q: string) {
    return this.applicationsService.searchByName(q ?? '');
  }

  @RequiresPermission('devices.view')
  @Get('/:id')
  async findApplication(@Param('id') id: string): Promise<any> {
    return this.applicationsService.findApplication(id);
  }
}
