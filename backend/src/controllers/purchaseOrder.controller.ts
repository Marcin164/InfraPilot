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
import { RequiresPermission } from 'src/decorators/requiresPermission.decorator';
import {
  PurchaseOrderService,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from 'src/services/purchaseOrder.service';
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

  @RequiresPermission('procurement.add')
  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    const requesterId = req?.user?.properties?.metadata?.id ?? req?.user?.id;
    const order = await this.poService.create(dto, requesterId);
    await this.auditService.log('PurchaseOrder', order.id, 'CREATED', {
      title: order.title,
    });
    return order;
  }

  @RequiresPermission('procurement.edit')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    const order = await this.poService.update(id, dto);
    await this.auditService.log('PurchaseOrder', id, 'UPDATED', dto);
    return order;
  }

  @RequiresPermission('helpdesk.approver')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdatePurchaseOrderStatusDto,
  ) {
    const order = await this.poService.updateStatus(id, body.status);
    await this.auditService.log('PurchaseOrder', id, 'STATUS_CHANGED', {
      status: body.status,
    });
    return order;
  }

  @RequiresPermission('procurement.delete')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.poService.remove(id);
    await this.auditService.log('PurchaseOrder', id, 'DELETED', {});
    return { ok: true };
  }
}
