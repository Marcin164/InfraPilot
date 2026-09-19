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
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
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

  // No @Roles here: creating/editing/deleting a shift is gated inside
  // ShiftsService against the specific employee's manager (or an admin),
  // not a static role — see ShiftsService.assertCanManage. Allow-listed in
  // rbac-coverage.spec.ts's KNOWN_PUBLIC_MUTATIONS for that reason.
  @Post()
  async create(@Request() req: any, @Body() dto: CreateShiftDto) {
    const shift = await this.shiftsService.create(
      dto,
      req.user.properties.metadata.id,
    );
    await this.auditService.log('SHIFT', shift.id, 'CREATED', {
      userId: shift.userId,
      type: shift.type,
    });
    return shift;
  }

  @RequiresPermission('shifts.edit')
  @Patch()
  updateShifts(@Request() req: any, @Body() dto: any) {
    return this.shiftsService.updateShifts(
      req.user.properties.metadata.id,
      dto,
    );
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    const shift = await this.shiftsService.update(
      id,
      dto,
      req.user.properties.metadata.id,
    );
    await this.auditService.log('SHIFT', shift.id, 'UPDATED', {
      type: shift.type,
    });
    return shift;
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const result = await this.shiftsService.remove(
      id,
      req.user.properties.metadata.id,
    );
    await this.auditService.log('SHIFT', id, 'DELETED', {});
    return result;
  }
}
