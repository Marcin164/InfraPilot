import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { ShiftsService } from 'src/services/shifts.service';
import { CreateShiftDto, UpdateShiftDto } from 'src/dto/shift.dto';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  getShifts(@Request() req: any) {
    return this.shiftsService.getShifts(req.user.id);
  }

  @Roles(Role.Admin)
  @Post()
  async create(@Body() dto: CreateShiftDto) {
    const shift = await this.shiftsService.create(dto);
    await this.auditService.log('SHIFT', shift.id, 'CREATED', {
      userId: shift.userId,
      type: shift.type,
    });
    return shift;
  }

  @Roles(Role.Admin)
  @Patch()
  updateShifts(@Request() req: any, @Body() dto: any) {
    return this.shiftsService.updateShifts(
      req.user.properties.metadata.id,
      dto,
    );
  }

  @Roles(Role.Admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    const shift = await this.shiftsService.update(id, dto);
    await this.auditService.log('SHIFT', shift.id, 'UPDATED', {
      type: shift.type,
    });
    return shift;
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.shiftsService.remove(id);
    await this.auditService.log('SHIFT', id, 'DELETED', {});
    return result;
  }
}
