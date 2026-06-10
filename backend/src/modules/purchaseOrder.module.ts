import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from 'src/entities/purchaseOrder.entity';
import { Users } from 'src/entities/users.entity';
import { PurchaseOrderService } from 'src/services/purchaseOrder.service';
import { PurchaseOrderController } from 'src/controllers/purchaseOrder.controller';
import { AuditModule } from './audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, Users]), AuditModule],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
