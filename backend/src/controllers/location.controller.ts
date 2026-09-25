import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  LocationService,
  CreateLocationDto,
  UpdateLocationDto,
} from 'src/services/location.service';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('locations')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly auditService: AuditService,
  ) {}

  // Plain name/hierarchy directory data -- used as a cross-cutting picker
  // in equipment forms, ticket updates, the device location tab, the asset
  // map and the IPAM subnet form, none of which imply
  // admin.locations.config. Left open on purpose, same reasoning as
  // devices.controller.ts's /options endpoint.
  @Get()
  findAll() {
    return this.locationService.findAll();
  }

  @Get('tree')
  findTree() {
    return this.locationService.findTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

  @RequiresPermission('admin.locations.config')
  @Post()
  async create(@Body() dto: CreateLocationDto) {
    const loc = await this.locationService.create(dto);
    await this.auditService.log('LOCATION', loc.id, 'CREATED', {
      name: loc.name,
    });
    return loc;
  }

  @RequiresPermission('admin.locations.config')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    const loc = await this.locationService.update(id, dto);
    await this.auditService.log('LOCATION', id, 'UPDATED', dto);
    return loc;
  }

  @RequiresPermission('admin.locations.config')
  @Post(':id/plan')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadPlan(@Param('id') id: string, @UploadedFile() file: any) {
    const loc = await this.locationService.uploadPlan(id, file);
    await this.auditService.log('LOCATION', id, 'PLAN_UPDATED', {});
    return loc;
  }

  // Device/user counts at this location -- used by the asset Map's building
  // popup (needs devices.view, the same permission the Map itself implies),
  // and by the Locations admin page (admin.locations.config). Unlike
  // findAll/findTree/findOne above, this is aggregate data, not a plain
  // picker, but it still shouldn't require the *admin* location permission
  // just to view a building's device count from the map.
  @RequiresPermission('devices.view', 'admin.locations.config')
  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.locationService.getSummary(id);
  }

  @RequiresPermission('admin.locations.config')
  @Get(':id/plan')
  async downloadPlan(@Param('id') id: string, @Res() res: Response) {
    const { location, stream } = await this.locationService.getPlanStream(id);
    res.setHeader(
      'Content-Type',
      location.planMimetype || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(location.planOriginalName ?? 'plan')}"`,
    );
    stream.pipe(res);
  }

  @RequiresPermission('admin.locations.config')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.locationService.remove(id);
    await this.auditService.log('LOCATION', id, 'DELETED', {});
    return { ok: true };
  }
}
