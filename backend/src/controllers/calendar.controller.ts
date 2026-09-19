import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { CalendarService } from 'src/services/calendar.service';
import {
  CreateCalendarDto,
  UpdateCalendarDto,
  AddHolidayDto,
} from 'src/dto/calendar.dto';

@UseGuards(AuthGuard)
@Controller('sla/calendars')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getAll() {
    return this.calendarService.getAll();
  }

  @RequiresPermission('helpdesk.sla.config')
  @Post()
  create(@Body() dto: CreateCalendarDto) {
    return this.calendarService.create(dto);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCalendarDto) {
    return this.calendarService.update(id, dto);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Post(':id/holidays')
  addHoliday(@Param('id') id: string, @Body() dto: AddHolidayDto) {
    return this.calendarService.addHoliday(id, dto);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Delete(':id/holidays')
  deleteHoliday(@Param('id') id: string) {
    return this.calendarService.deleteHoliday(id);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.calendarService.delete(id);
  }
}
