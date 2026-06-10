import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard.guard';
import { Role, Roles } from 'src/decorators/roles.decorator';
import { PurchaseOrderService, CreatePurchaseOrderDto } from 'src/services/purchaseOrder.service';
import { PurchaseOrderStatus } from 'src/entities/purchaseOrder.entity';
import { AuditService } from 'src/services/audit.service';

@UseGuards(AuthGuard)
@Controller('procurement')
export class PurchaseOrderController {
  constructor(
    private readonly poService: PurchaseOrderService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  findAll(@Query() query: any) {
    return this.poService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Roles(Role.Admin)
  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    const requesterId = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    const order = await this.poService.create(dto, requesterId);
    await this.auditService.log('PurchaseOrder', order.id, 'CREATED', { title: order.title });
    return order;
  }

  @Roles(Role.Admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreatePurchaseOrderDto>) {
    const order = await this.poService.update(id, dto);
    await this.auditService.log('PurchaseOrder', id, 'UPDATED', dto);
    return order;
  }

  @Roles(Role.Admin)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: PurchaseOrderStatus }) {
    const order = await this.poService.updateStatus(id, body.status);
    await this.auditService.log('PurchaseOrder', id, 'STATUS_CHANGED', { status: body.status });
    return order;
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.poService.remove(id);
    await this.auditService.log('PurchaseOrder', id, 'DELETED', {});
    return { ok: true };
  }
}
