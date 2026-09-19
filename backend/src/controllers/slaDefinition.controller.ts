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
import { SlaDefinitionService } from 'src/services/slaDefinition.service';
import {
  CreateSlaDefinitionDto,
  UpdateSlaDefinitionDto,
} from 'src/dto/slaDefinition.dto';

@UseGuards(AuthGuard)
@Controller('sla/definitions')
export class SlaDefinitionController {
  constructor(private readonly service: SlaDefinitionService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @RequiresPermission('helpdesk.sla.config')
  @Post()
  create(@Body() dto: CreateSlaDefinitionDto) {
    return this.service.create(dto);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSlaDefinitionDto) {
    return this.service.update(id, dto);
  }

  @RequiresPermission('helpdesk.sla.config')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
