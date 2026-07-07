import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.locationService.remove(id);
    await this.auditService.log('LOCATION', id, 'DELETED', {});
    return { ok: true };
  }
}
