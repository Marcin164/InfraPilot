import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import * as fs from 'fs';
import * as path from 'path';
import { Location, LocationType } from 'src/entities/location.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { DevicesService } from 'src/services/devices.service';

const PLAN_DIR = path.resolve(process.cwd(), 'uploads', 'locations');

const ALLOWED_PLAN_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/svg+xml',
]);

export class CreateLocationDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsIn(['building', 'floor', 'room', 'rack', 'other'])
  type?: LocationType;

  @IsOptional() @IsString()
  parentId?: string | null;

  @IsOptional() @IsString()
  description?: string | null;

  @IsOptional() @IsNumber() @Min(-90) @Max(90)
  latitude?: number | null;

  @IsOptional() @IsNumber() @Min(-180) @Max(180)
  longitude?: number | null;

  @IsOptional() @IsNumber() @Min(0) @Max(1)
  planX?: number | null;

  @IsOptional() @IsNumber() @Min(0) @Max(1)
  planY?: number | null;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly repo: Repository<Location>,
    private readonly devicesService: DevicesService,
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
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      planX: dto.planX ?? null,
      planY: dto.planY ?? null,
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

  async uploadPlan(id: string, file: any): Promise<Location> {
    const loc = await this.findOne(id);
    if (loc.type !== LocationType.FLOOR) {
      throw new BadRequestException('Only floor locations can have a plan');
    }
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_PLAN_MIME.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (!fs.existsSync(PLAN_DIR)) {
      fs.mkdirSync(PLAN_DIR, { recursive: true });
    }

    if (loc.planPath && fs.existsSync(loc.planPath)) {
      fs.unlinkSync(loc.planPath);
    }

    const ext = path.extname(file.originalname) || '';
    const storedName = `${uuidv4()}${ext}`;
    const filePath = path.join(PLAN_DIR, storedName);
    fs.writeFileSync(filePath, file.buffer);

    loc.planPath = filePath;
    loc.planMimetype = file.mimetype;
    loc.planOriginalName = file.originalname;
    return this.repo.save(loc);
  }

  async getPlanStream(
    id: string,
  ): Promise<{ location: Location; stream: fs.ReadStream }> {
    const loc = await this.findOne(id);
    if (!loc.planPath || !fs.existsSync(loc.planPath)) {
      throw new NotFoundException('Plan not found');
    }
    return { location: loc, stream: fs.createReadStream(loc.planPath) };
  }

  /**
   * Building-popup summary: the location's full descendant subtree, plus
   * device/user counts recursively aggregated over that subtree (a location
   * or its descendants), since equipment/people are assigned to a specific
   * floor/room rather than the top-level building record itself.
   */
  async getSummary(id: string) {
    const location = await this.findOne(id);
    const all = await this.repo.find({ order: { name: 'ASC' } });

    const descendantIds: string[] = [];
    const collect = (parentId: string) => {
      for (const l of all.filter((x) => x.parentId === parentId)) {
        descendantIds.push(l.id);
        collect(l.id);
      }
    };
    collect(id);

    const children = this.buildTree(all, id);
    const devices = await this.devicesService.findByLocationIds([
      id,
      ...descendantIds,
    ]);

    const usersMap = new Map<string, { id: string; name: string }>();
    for (const d of devices) {
      const user = (d as any).user;
      if (user && !usersMap.has(user.id)) {
        const name =
          `${user.name ?? ''} ${user.surname ?? ''}`.trim() ||
          user.username ||
          user.email;
        usersMap.set(user.id, { id: user.id, name });
      }
    }

    return {
      location,
      children,
      deviceCount: devices.length,
      devices: devices.map((d) => ({
        id: d.id,
        name: d.assetName || d.model || d.id,
      })),
      userCount: usersMap.size,
      users: Array.from(usersMap.values()),
    };
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
