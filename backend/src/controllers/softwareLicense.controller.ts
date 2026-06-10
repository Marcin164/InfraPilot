import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { SoftwareLicenseService } from 'src/services/softwareLicense.service';
import {
  CreateAssignmentDto,
  CreateLicenseDto,
  UpdateLicenseDto,
} from 'src/dto/softwareLicense.dto';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('licenses')
export class SoftwareLicenseController {
  constructor(
    private readonly licenseService: SoftwareLicenseService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async findAll() {
    return this.licenseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.licenseService.findOne(id);
  }

  @Roles(Role.Admin)
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() dto: CreateLicenseDto) {
    const license = await this.licenseService.create(dto);
    await this.auditService.log('SOFTWARE_LICENSE', license.id, 'CREATED', { name: license.name });
    return license;
  }

  @Roles(Role.Admin)
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateLicenseDto) {
    const license = await this.licenseService.update(id, dto);
    await this.auditService.log('SOFTWARE_LICENSE', id, 'UPDATED', dto);
    return license;
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.licenseService.remove(id);
    await this.auditService.log('SOFTWARE_LICENSE', id, 'DELETED', {});
    return { ok: true };
  }

  @Get(':id/assignments')
  async getAssignments(@Param('id') id: string) {
    return this.licenseService.getAssignments(id);
  }

  @Roles(Role.Admin)
  @Post('assignments')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async assign(@Body() dto: CreateAssignmentDto) {
    const assignment = await this.licenseService.assign(dto);
    await this.auditService.log(
      'SOFTWARE_LICENSE_ASSIGNMENT',
      assignment.id,
      'CREATED',
      { licenseId: dto.licenseId, deviceId: dto.deviceId, userId: dto.userId },
    );
    return assignment;
  }

  @Roles(Role.Admin)
  @Delete('assignments/:assignmentId')
  async unassign(@Param('assignmentId') assignmentId: string) {
    await this.licenseService.unassign(assignmentId);
    await this.auditService.log(
      'SOFTWARE_LICENSE_ASSIGNMENT',
      assignmentId,
      'DELETED',
      {},
    );
    return { ok: true };
  }
}
