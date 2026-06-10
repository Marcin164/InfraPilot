import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Location, LocationType } from 'src/entities/location.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

export class CreateLocationDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsIn(['building', 'floor', 'room', 'rack', 'other'])
  type?: LocationType;

  @IsOptional() @IsString()
  parentId?: string | null;

  @IsOptional() @IsString()
  description?: string | null;
}

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly repo: Repository<Location>,
  ) {}

  /** Returns the full tree: each location with its children nested. */
  async findTree(): Promise<any[]> {
    const all = await this.repo.find({ order: { name: 'ASC' } });
    return this.buildTree(all);
  }

  async findAll(): Promise<Location[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Location> {
    const loc = await this.repo.findOneBy({ id });
    if (!loc) throw new NotFoundException('Location not found');
    return loc;
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    if (dto.parentId) {
      const parent = await this.repo.findOneBy({ id: dto.parentId });
      if (!parent) throw new BadRequestException('Parent location not found');
    }
    const loc = this.repo.create({
      id: uuidv4(),
      name: dto.name,
      type: dto.type ?? LocationType.OTHER,
      parentId: dto.parentId ?? null,
      description: dto.description ?? null,
    });
    return this.repo.save(loc);
  }

  async update(id: string, dto: Partial<CreateLocationDto>): Promise<Location> {
    const loc = await this.findOne(id);
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new BadRequestException('Cannot set self as parent');
      if (dto.parentId) {
        const parent = await this.repo.findOneBy({ id: dto.parentId });
        if (!parent) throw new BadRequestException('Parent location not found');
      }
    }
    Object.assign(loc, dto);
    return this.repo.save(loc);
  }

  async remove(id: string): Promise<void> {
    const loc = await this.findOne(id);
    const children = await this.repo.countBy({ parentId: id });
    if (children > 0) {
      throw new BadRequestException(
        'Cannot delete a location that has children — reassign or delete them first',
      );
    }
    await this.repo.remove(loc);
  }

  private buildTree(locations: Location[], parentId: string | null = null): any[] {
    return locations
      .filter((l) => l.parentId === parentId)
      .map((l) => ({
        ...l,
        children: this.buildTree(locations, l.id),
      }));
  }
}
