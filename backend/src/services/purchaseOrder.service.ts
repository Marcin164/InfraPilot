import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PurchaseOrder, PurchaseOrderStatus } from 'src/entities/purchaseOrder.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

export class CreatePurchaseOrderDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  supplier?: string;

  @IsOptional() @IsString()
  requesterId?: string;

  @IsOptional()
  @IsIn(['draft', 'submitted', 'approved', 'ordered', 'received', 'cancelled'])
  status?: PurchaseOrderStatus;

  @IsOptional() @IsString()
  orderDate?: string;

  @IsOptional() @IsString()
  expectedDelivery?: string;

  @IsOptional() @IsString()
  receivedAt?: string;

  @IsOptional()
  totalCost?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  notes?: string;
}

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly repo: Repository<PurchaseOrder>,
  ) {}

  async findAll(query: any = {}): Promise<{ data: PurchaseOrder[]; total: number }> {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(query.limit, 10) || 30, 1);

    const [data, total] = await this.repo.findAndCount({
      relations: ['requester'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const order = await this.repo.findOne({ where: { id }, relations: ['requester'] });
    if (!order) throw new NotFoundException('Purchase order not found');
    return order;
  }

  async create(dto: CreatePurchaseOrderDto, requesterId?: string): Promise<PurchaseOrder> {
    const order = Object.assign(this.repo.create(), {
      id: uuidv4(),
      title: dto.title,
      supplier: dto.supplier ?? null,
      requesterId: requesterId ?? dto.requesterId ?? null,
      status: dto.status ?? PurchaseOrderStatus.DRAFT,
      orderDate: dto.orderDate ? new Date(dto.orderDate) : null,
      expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
      receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : null,
      totalCost: dto.totalCost ?? null,
      currency: dto.currency ?? null,
      notes: dto.notes ?? null,
    });
    return this.repo.save(order);
  }

  async update(id: string, dto: Partial<CreatePurchaseOrderDto>): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    Object.assign(order, {
      ...dto,
      orderDate: dto.orderDate !== undefined
        ? (dto.orderDate ? new Date(dto.orderDate) : null)
        : order.orderDate,
      expectedDelivery: dto.expectedDelivery !== undefined
        ? (dto.expectedDelivery ? new Date(dto.expectedDelivery) : null)
        : order.expectedDelivery,
      receivedAt: dto.receivedAt !== undefined
        ? (dto.receivedAt ? new Date(dto.receivedAt) : null)
        : order.receivedAt,
    });
    return this.repo.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.repo.remove(order);
  }

  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    order.status = status;
    if (status === PurchaseOrderStatus.RECEIVED && !order.receivedAt) {
      order.receivedAt = new Date();
    }
    return this.repo.save(order);
  }
}
