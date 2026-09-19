import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import { EscalationConfigService } from 'src/services/escalationConfig.service';
import {
  CreateEscalationConfigDto,
  UpdateEscalationConfigDto,
} from 'src/dto/slaEscalationConfig.dto';

@UseGuards(AuthGuard)
@Controller('sla/escalations')
export class SlaEscalationConfigController {
  constructor(private readonly service: EscalationConfigService) {}

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Get('definitions')
  async getEscalationsGroupedBySla() {
    return this.service.getEscalationsGroupedBySla();
  }

  @RequiresPermission('helpdesk.sla.config')
  @Post()
  async create(@Body() dto: CreateEscalationConfigDto) {
    return this.service.create(dto);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEscalationConfigDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
