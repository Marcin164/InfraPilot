import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { DhcpDriverType, DhcpServer } from 'src/entities/dhcpServer.entity';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { Devices } from 'src/entities/devices.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

export class CreateDhcpServerDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @IsEnum(DhcpDriverType)
  driverType: DhcpDriverType;

  @IsOptional() @IsString()
  deviceId?: string | null;

  @IsOptional() @IsObject()
  config?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  enabled?: boolean;
}

export class UpdateDhcpServerDto extends PartialType(CreateDhcpServerDto) {}

/** Per-driver config shape validation -- extend when a new DhcpDriverType is added. */
function validateConfig(driverType: DhcpDriverType, deviceId: string | null | undefined, config: Record<string, unknown> | undefined) {
  if (driverType === DhcpDriverType.SSH_SCRAPE) {
    if (!deviceId) throw new BadRequestException('ssh_scrape requires deviceId');
    if (!config?.command || !config?.lineTemplate) {
      throw new BadRequestException('ssh_scrape requires config.command and config.lineTemplate');
    }
  }
}

@Injectable()
export class DhcpServerService {
  constructor(
    @InjectRepository(DhcpServer)
    private readonly sources: Repository<DhcpServer>,
    @InjectRepository(NetworkDeviceCredential)
    private readonly credentials: Repository<NetworkDeviceCredential>,
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
  ) {}

  async findAll(): Promise<DhcpServer[]> {
    return this.sources.find({ order: { name: 'ASC' }, relations: ['device'] });
  }

  async findOne(id: string): Promise<DhcpServer> {
    const source = await this.sources.findOne({ where: { id }, relations: ['device'] });
    if (!source) throw new NotFoundException('DHCP server not found');
    return source;
  }

  async create(dto: CreateDhcpServerDto): Promise<DhcpServer> {
    validateConfig(dto.driverType, dto.deviceId, dto.config);

    if (dto.deviceId) {
      const device = await this.devices.findOneBy({ id: dto.deviceId });
      if (!device) throw new BadRequestException('Device not found');
    }
    if (dto.driverType === DhcpDriverType.SSH_SCRAPE) {
      const cred = await this.credentials.findOneBy({ deviceId: dto.deviceId! });
      if (!cred) throw new BadRequestException('Configure an SSH credential for this device first (Device > Backup tab)');
    }

    const source = this.sources.create({
      id: uuidv4(),
      name: dto.name,
      driverType: dto.driverType,
      deviceId: dto.deviceId ?? null,
      config: dto.config ?? {},
      enabled: dto.enabled ?? false,
    });
    return this.sources.save(source);
  }

  async update(id: string, dto: UpdateDhcpServerDto): Promise<DhcpServer> {
    const source = await this.findOne(id);
    const driverType = dto.driverType ?? source.driverType;
    const deviceId = dto.deviceId !== undefined ? dto.deviceId : source.deviceId;
    const config = dto.config ?? source.config;
    validateConfig(driverType, deviceId, config);

    Object.assign(source, {
      name: dto.name ?? source.name,
      driverType,
      deviceId,
      config,
      enabled: dto.enabled ?? source.enabled,
    });
    return this.sources.save(source);
  }

  async remove(id: string): Promise<void> {
    const source = await this.findOne(id);
    await this.sources.remove(source);
  }
}
