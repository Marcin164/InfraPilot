import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Subnet } from 'src/entities/subnet.entity';
import {
  IpAllocation,
  IpAllocationSource,
  IpAllocationStatus,
} from 'src/entities/ipAllocation.entity';
import { Devices } from 'src/entities/devices.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { cidrRange, ipToInt, isIpInCidr } from 'src/helpers/cidr';

export class CreateSubnetDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  cidr: string;

  @IsOptional() @IsString()
  vlan?: string | null;

  @IsOptional() @IsString()
  gateway?: string | null;

  @IsOptional()
  dnsServers?: string[] | null;

  @IsOptional() @IsString()
  locationId?: string | null;

  @IsOptional() @IsString()
  notes?: string | null;
}

export class CreateAllocationDto {
  @IsOptional() @IsString()
  subnetId?: string | null;

  @IsString() @IsNotEmpty()
  ip: string;

  @IsIn(['reserved', 'assigned', 'leased'])
  status: IpAllocationStatus;

  @IsOptional() @IsString()
  deviceId?: string | null;

  @IsOptional() @IsString()
  hostname?: string | null;

  @IsOptional() @IsString()
  macAddress?: string | null;

  @IsOptional() @IsString()
  notes?: string | null;
}

type KnownIp = { ip: string; ownerKey: string; label: string; deviceId: string };

@Injectable()
export class IpamService {
  constructor(
    @InjectRepository(Subnet)
    private readonly subnets: Repository<Subnet>,
    @InjectRepository(IpAllocation)
    private readonly allocations: Repository<IpAllocation>,
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
  ) {}

  // ---- Subnet CRUD ----

  async findAllSubnets(): Promise<Subnet[]> {
    return this.subnets.find({ order: { name: 'ASC' } });
  }

  async findSubnet(id: string): Promise<Subnet> {
    const subnet = await this.subnets.findOneBy({ id });
    if (!subnet) throw new NotFoundException('Subnet not found');
    return subnet;
  }

  async createSubnet(dto: CreateSubnetDto): Promise<Subnet> {
    cidrRange(dto.cidr); // throws if invalid
    const subnet = this.subnets.create({
      id: uuidv4(),
      name: dto.name,
      cidr: dto.cidr,
      vlan: dto.vlan ?? null,
      gateway: dto.gateway ?? null,
      dnsServers: dto.dnsServers ?? null,
      locationId: dto.locationId ?? null,
      notes: dto.notes ?? null,
    });
    return this.subnets.save(subnet);
  }

  async updateSubnet(id: string, dto: Partial<CreateSubnetDto>): Promise<Subnet> {
    const subnet = await this.findSubnet(id);
    if (dto.cidr) cidrRange(dto.cidr);
    Object.assign(subnet, dto);
    return this.subnets.save(subnet);
  }

  async removeSubnet(id: string): Promise<void> {
    const subnet = await this.findSubnet(id);
    await this.subnets.remove(subnet);
  }

  // ---- Allocations ----

  async listAllocations(subnetId?: string): Promise<IpAllocation[]> {
    if (!subnetId) return this.allocations.find({ order: { ip: 'ASC' } });
    return this.allocations.find({ where: { subnetId }, order: { ip: 'ASC' } });
  }

  async createAllocation(dto: CreateAllocationDto): Promise<IpAllocation> {
    ipToInt(dto.ip); // throws if invalid
    if (dto.deviceId) {
      const device = await this.devices.findOneBy({ id: dto.deviceId });
      if (!device) throw new BadRequestException('Device not found');
    }
    const allocation = this.allocations.create({
      id: uuidv4(),
      subnetId: dto.subnetId ?? null,
      ip: dto.ip,
      status: dto.status,
      deviceId: dto.deviceId ?? null,
      hostname: dto.hostname ?? null,
      macAddress: dto.macAddress ?? null,
      source: IpAllocationSource.MANUAL,
      notes: dto.notes ?? null,
    });
    return this.allocations.save(allocation);
  }

  async removeAllocation(id: string): Promise<void> {
    const allocation = await this.allocations.findOneBy({ id });
    if (!allocation) throw new NotFoundException('Allocation not found');
    await this.allocations.remove(allocation);
  }

  // ---- Utilization & conflicts ----

  async getSubnetUtilization(subnetId: string): Promise<{
    subnet: Subnet;
    total: number;
    used: number;
    free: number;
    entries: Array<{ id: string | null; ip: string; label: string; deviceId: string | null; source: string }>;
  }> {
    const subnet = await this.findSubnet(subnetId);
    const { total } = cidrRange(subnet.cidr);

    const known = await this.getAllKnownIps();
    const allocations = await this.allocations.find({ where: { subnetId } });

    const byIp = new Map<string, { id: string | null; ip: string; label: string; deviceId: string | null; source: string }>();
    for (const k of known) {
      if (isIpInCidr(k.ip, subnet.cidr)) {
        byIp.set(k.ip, { id: null, ip: k.ip, label: k.label, deviceId: k.deviceId || null, source: 'device' });
      }
    }
    for (const a of allocations) {
      if (isIpInCidr(a.ip, subnet.cidr)) {
        byIp.set(a.ip, {
          id: a.id,
          ip: a.ip,
          label: a.hostname || a.macAddress || a.ip,
          deviceId: a.deviceId,
          source: a.source,
        });
      }
    }

    const entries = Array.from(byIp.values()).sort((x, y) => ipToInt(x.ip) - ipToInt(y.ip));
    return { subnet, total, used: entries.length, free: Math.max(0, total - entries.length), entries };
  }

  /** Cross-references live device IPs + recorded allocations; returns IPs claimed by more than one distinct owner. */
  async getConflicts(): Promise<Array<{ ip: string; owners: Array<{ key: string; label: string }> }>> {
    const known = await this.getAllKnownIps();
    const allocations = await this.allocations.find();

    const byIp = new Map<string, Map<string, string>>(); // ip -> ownerKey -> label
    const add = (ip: string, ownerKey: string, label: string) => {
      if (!byIp.has(ip)) byIp.set(ip, new Map());
      byIp.get(ip)!.set(ownerKey, label);
    };

    for (const k of known) add(k.ip, k.ownerKey, k.label);
    let fallbackCounter = 0;
    for (const a of allocations) {
      const ownerKey = a.deviceId || a.macAddress || a.hostname || `row:${a.id}:${fallbackCounter++}`;
      add(a.ip, ownerKey, a.hostname || a.macAddress || a.ip);
    }

    const conflicts: Array<{ ip: string; owners: Array<{ key: string; label: string }> }> = [];
    for (const [ip, owners] of byIp.entries()) {
      if (owners.size > 1) {
        conflicts.push({
          ip,
          owners: Array.from(owners.entries()).map(([key, label]) => ({ key, label })),
        });
      }
    }
    return conflicts;
  }

  /** All IPs this app currently knows a device is using: managementIp (network gear) + agent-scanned NIC IPv4s (endpoints). */
  private async getAllKnownIps(): Promise<KnownIp[]> {
    const devices = await this.devices.find();
    const out: KnownIp[] = [];
    for (const d of devices) {
      const label = d.assetName || d.model || d.id;
      if (d.managementIp) {
        out.push({ ip: d.managementIp, ownerKey: d.id, label, deviceId: d.id });
      }
      const nicConfig = (d.network as any)?.nic_config;
      if (Array.isArray(nicConfig)) {
        for (const nic of nicConfig) {
          if (nic?.IPv4Address) {
            out.push({ ip: nic.IPv4Address, ownerKey: d.id, label, deviceId: d.id });
          }
        }
      }
    }
    return out;
  }
}
