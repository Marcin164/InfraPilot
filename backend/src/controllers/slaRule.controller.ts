import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { SlaRuleService } from 'src/services/slaRule.service';
import { CreateSlaRuleDto, ReplaceSlaRuleMatrixDto, UpdateSlaRuleDto } from 'src/dto/slaRule.dto';

@UseGuards(AuthGuard)
@Controller('sla/rules')
export class SlaRuleController {
  constructor(private readonly service: SlaRuleService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Roles(Role.Admin)
  @Put('matrix')
  replaceMatrix(@Body() dto: ReplaceSlaRuleMatrixDto) {
    return this.service.replaceMatrix(dto.entries);
  }

  @Roles(Role.Admin)
  @Post()
  create(@Body() dto: CreateSlaRuleDto) {
    return this.service.create(dto);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSlaRuleDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
