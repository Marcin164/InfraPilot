import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Maintenance, MaintenanceType } from 'src/entities/maintenance.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

export class CreateMaintenanceDto {
  @IsString()
  deviceId: string;

  @IsOptional() @IsIn(['scheduled', 'repair', 'inspection', 'upgrade', 'other'])
  type?: MaintenanceType;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  performedBy?: string;

  @IsOptional()
  cost?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  performedAt?: string;

  @IsOptional() @IsString()
  nextDueAt?: string;

  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateMaintenanceDto extends PartialType(CreateMaintenanceDto) {}

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly repo: Repository<Maintenance>,
  ) {}

  async findByDevice(deviceId: string): Promise<Maintenance[]> {
    return this.repo.find({
      where: { deviceId },
      order: { performedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findUpcoming(days = 30): Promise<Maintenance[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    return this.repo
      .createQueryBuilder('m')
      .where('m.nextDueAt >= :now', { now })
      .andWhere('m.nextDueAt <= :future', { future })
      .orderBy('m.nextDueAt', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Maintenance> {
    const record = await this.repo.findOneBy({ id });
    if (!record) throw new NotFoundException('Maintenance record not found');
    return record;
  }

  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const record = Object.assign(this.repo.create(), {
      id: uuidv4(),
      deviceId: dto.deviceId,
      type: dto.type ?? MaintenanceType.OTHER,
      description: dto.description ?? null,
      performedBy: dto.performedBy ?? null,
      cost: dto.cost ?? null,
      currency: dto.currency ?? null,
      performedAt: dto.performedAt ? new Date(dto.performedAt) : null,
      nextDueAt: dto.nextDueAt ? new Date(dto.nextDueAt) : null,
      notes: dto.notes ?? null,
    });
    return this.repo.save(record);
  }

  async update(id: string, dto: Partial<CreateMaintenanceDto>): Promise<Maintenance> {
    const record = await this.findOne(id);
    Object.assign(record, {
      ...dto,
      performedAt: dto.performedAt !== undefined
        ? (dto.performedAt ? new Date(dto.performedAt) : null)
        : record.performedAt,
      nextDueAt: dto.nextDueAt !== undefined
        ? (dto.nextDueAt ? new Date(dto.nextDueAt) : null)
        : record.nextDueAt,
    });
    return this.repo.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
  }
}
