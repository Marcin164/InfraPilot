import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NetworkConnection, NetworkLinkType } from 'src/entities/networkConnection.entity';
import { Devices } from 'src/entities/devices.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

export class CreateNetworkConnectionDto {
  @IsString() @IsNotEmpty()
  sourceDeviceId: string;

  @IsOptional() @IsString()
  sourcePort?: string | null;

  @IsString() @IsNotEmpty()
  targetDeviceId: string;

  @IsOptional() @IsString()
  targetPort?: string | null;

  @IsOptional() @IsEnum(NetworkLinkType)
  linkType?: NetworkLinkType;

  @IsOptional() @IsString()
  vlan?: string | null;

  @IsOptional() @IsString()
  notes?: string | null;
}

@Injectable()
export class NetworkConnectionsService {
  constructor(
    @InjectRepository(NetworkConnection)
    private readonly repo: Repository<NetworkConnection>,
    @InjectRepository(Devices)
    private readonly devicesRepo: Repository<Devices>,
  ) {}

  async findAll(deviceId?: string): Promise<NetworkConnection[]> {
    if (!deviceId) {
      return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    return this.repo
      .createQueryBuilder('c')
      .where('c.sourceDeviceId = :deviceId OR c.targetDeviceId = :deviceId', { deviceId })
      .orderBy('c.createdAt', 'DESC')
      .getMany();
  }

  async getTopology(): Promise<{ nodes: Partial<Devices>[]; edges: NetworkConnection[] }> {
    const edges = await this.repo.find();
    const deviceIds = new Set<string>();
    for (const edge of edges) {
      deviceIds.add(edge.sourceDeviceId);
      deviceIds.add(edge.targetDeviceId);
    }
    if (deviceIds.size === 0) {
      return { nodes: [], edges: [] };
    }
    const devices = await this.devicesRepo.find({
      where: { id: In(Array.from(deviceIds)) },
    });
    const nodes = devices.map((d) => ({
      id: d.id,
      assetName: d.assetName,
      group: d.group,
      subgroup: d.subgroup,
      manufacturer: d.manufacturer,
      model: d.model,
      lifecycle: d.lifecycle,
      managementIp: d.managementIp,
    }));
    return { nodes, edges };
  }

  async create(dto: CreateNetworkConnectionDto, createdBy?: string): Promise<NetworkConnection> {
    if (dto.sourceDeviceId === dto.targetDeviceId) {
      throw new BadRequestException('A device cannot connect to itself');
    }
    const [source, target] = await Promise.all([
      this.devicesRepo.findOneBy({ id: dto.sourceDeviceId }),
      this.devicesRepo.findOneBy({ id: dto.targetDeviceId }),
    ]);
    if (!source) throw new BadRequestException('Source device not found');
    if (!target) throw new BadRequestException('Target device not found');

    const sourcePort = dto.sourcePort?.trim() || null;
    const targetPort = dto.targetPort?.trim() || null;

    // Pull every existing connection touching either endpoint -- needed to
    // detect both "this exact link already exists" and "that port is
    // already used by a different link" (a physical port can only carry
    // one cable, but the two ends can legitimately have multiple distinct
    // links to each other, e.g. a bonded/aggregated pair of ports).
    const related = await this.repo
      .createQueryBuilder('c')
      .where('c.sourceDeviceId IN (:...ids) OR c.targetDeviceId IN (:...ids)', {
        ids: [dto.sourceDeviceId, dto.targetDeviceId],
      })
      .getMany();

    const isSamePair = (c: NetworkConnection) =>
      (c.sourceDeviceId === dto.sourceDeviceId &&
        c.targetDeviceId === dto.targetDeviceId &&
        c.sourcePort === sourcePort &&
        c.targetPort === targetPort) ||
      (c.sourceDeviceId === dto.targetDeviceId &&
        c.targetDeviceId === dto.sourceDeviceId &&
        c.sourcePort === targetPort &&
        c.targetPort === sourcePort);

    if (related.some(isSamePair)) {
      throw new BadRequestException('This exact connection already exists');
    }

    const deviceLabel = (d: Devices) =>
      d.assetName || `${d.manufacturer ?? ''} ${d.model ?? ''}`.trim() || d.id;

    if (sourcePort) {
      const portTaken = related.some(
        (c) =>
          (c.sourceDeviceId === dto.sourceDeviceId && c.sourcePort === sourcePort) ||
          (c.targetDeviceId === dto.sourceDeviceId && c.targetPort === sourcePort),
      );
      if (portTaken) {
        throw new BadRequestException(
          `${deviceLabel(source)}: port "${sourcePort}" is already used by another connection`,
        );
      }
    }
    if (targetPort) {
      const portTaken = related.some(
        (c) =>
          (c.sourceDeviceId === dto.targetDeviceId && c.sourcePort === targetPort) ||
          (c.targetDeviceId === dto.targetDeviceId && c.targetPort === targetPort),
      );
      if (portTaken) {
        throw new BadRequestException(
          `${deviceLabel(target)}: port "${targetPort}" is already used by another connection`,
        );
      }
    }

    const conn = this.repo.create({
      id: uuidv4(),
      sourceDeviceId: dto.sourceDeviceId,
      sourcePort,
      targetDeviceId: dto.targetDeviceId,
      targetPort,
      linkType: dto.linkType ?? NetworkLinkType.ETHERNET,
      vlan: dto.vlan ?? null,
      notes: dto.notes ?? null,
      createdBy: createdBy ?? null,
    });
    return this.repo.save(conn);
  }

  async remove(id: string): Promise<void> {
    const conn = await this.repo.findOneBy({ id });
    if (!conn) throw new NotFoundException('Connection not found');
    await this.repo.remove(conn);
  }
}
