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
import { Role, Roles } from 'src/decorators/roles.decorator';
import { LocationService, CreateLocationDto, UpdateLocationDto } from 'src/services/location.service';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('locations')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly auditService: AuditService,
  ) {}

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

  @Roles(Role.Admin)
  @Post()
  async create(@Body() dto: CreateLocationDto) {
    const loc = await this.locationService.create(dto);
    await this.auditService.log('LOCATION', loc.id, 'CREATED', { name: loc.name });
    return loc;
  }

  @Roles(Role.Admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    const loc = await this.locationService.update(id, dto);
    await this.auditService.log('LOCATION', id, 'UPDATED', dto);
    return loc;
  }

  @Roles(Role.Admin)
  @Post(':id/plan')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadPlan(@Param('id') id: string, @UploadedFile() file: any) {
    const loc = await this.locationService.uploadPlan(id, file);
    await this.auditService.log('LOCATION', id, 'PLAN_UPDATED', {});
    return loc;
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.locationService.getSummary(id);
  }

  @Get(':id/plan')
  async downloadPlan(@Param('id') id: string, @Res() res: Response) {
    const { location, stream } = await this.locationService.getPlanStream(id);
    res.setHeader('Content-Type', location.planMimetype || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(location.planOriginalName ?? 'plan')}"`,
    );
    stream.pipe(res);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.locationService.remove(id);
    await this.auditService.log('LOCATION', id, 'DELETED', {});
    return { ok: true };
  }
}
