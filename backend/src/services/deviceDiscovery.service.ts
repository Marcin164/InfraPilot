import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Devices } from 'src/entities/devices.entity';
import {
  IpAllocation,
  IpAllocationSource,
} from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';
import { DeviceTagsService } from 'src/services/deviceTags.service';
import { uuidv4 } from 'src/helpers/uuidv4';
import { classifyDiscoveredHost } from 'src/helpers/classifyDevice';

const AUTO_DISCOVERED_TAG = {
  key: 'auto-discovered',
  label: 'Auto-discovered',
  color: '#8E44AD',
  description:
    'Created automatically from a network_scan agent task -- review group/subgroup before trusting it.',
};

export type DiscoveredHost = {
  ip: string;
  mac?: string | null;
  hostname?: string | null;
  respondedToPing?: boolean;
  openPorts?: number[] | null;
};

@Injectable()
export class DeviceDiscoveryService {
  private readonly logger = new Logger(DeviceDiscoveryService.name);

  constructor(
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
    @InjectRepository(IpAllocation)
    private readonly allocations: Repository<IpAllocation>,
    @InjectRepository(Subnet)
    private readonly subnets: Repository<Subnet>,
    private readonly deviceTags: DeviceTagsService,
  ) {}

  /**
   * Turns network_scan results into real Devices rows -- matching an
   * already-known device by MAC when possible (so an enrolled agent's
   * own subnet never gets a duplicate entry for itself), otherwise
   * creating a new, best-effort-classified row tagged "auto-discovered"
   * so it's easy to bulk-review later. See classifyDevice.ts for how
   * group/subgroup is guessed -- it's a guess, not a confirmed identity.
   */
  async ingestScanResults(
    hosts: DiscoveredHost[],
    subnetId: string | null,
  ): Promise<void> {
    const locationId = subnetId
      ? ((await this.subnets.findOneBy({ id: subnetId }))?.locationId ?? null)
      : null;
    const autoDiscoveredTagId = await this.findOrCreateAutoDiscoveredTag();

    for (const host of hosts) {
      if (!host.mac) continue; // nothing to key an identity on

      try {
        const existing = await this.findByMac(host.mac);
        const deviceId = existing
          ? existing.id
          : await this.createDevice(host, locationId, autoDiscoveredTagId);
        await this.allocations.update(
          { ip: host.ip, source: IpAllocationSource.SCAN },
          { deviceId },
        );
      } catch (err) {
        this.logger.warn(
          `Failed to ingest scan host ${host.ip}: ${(err as Error).message}`,
        );
      }
    }
  }

  private async findByMac(mac: string): Promise<Devices | null> {
    return this.devices
      .createQueryBuilder('d')
      .where('jsonb_exists(d."macAddresses", :mac)', { mac })
      .getOne();
  }

  private async createDevice(
    host: DiscoveredHost,
    locationId: string | null,
    autoDiscoveredTagId: string,
  ): Promise<string> {
    const { group, subgroup } = classifyDiscoveredHost({
      mac: host.mac,
      openPorts: host.openPorts,
    });
    const id = uuidv4();
    const device = this.devices.create({
      id,
      group,
      subgroup: subgroup ?? undefined,
      state: 'active',
      isOn: !!host.respondedToPing,
      assetName: host.hostname || host.ip,
      macAddresses: host.mac ? [host.mac] : null,
      managementIp: host.ip,
      locationId,
    });
    await this.devices.save(device);
    await this.deviceTags.attach(
      [id],
      [autoDiscoveredTagId],
      'system:network-scan',
    );
    return id;
  }

  private async findOrCreateAutoDiscoveredTag(): Promise<string> {
    const tags = await this.deviceTags.listTags();
    const existing = tags.find((t) => t.key === AUTO_DISCOVERED_TAG.key);
    if (existing) return existing.id;
    try {
      const created = await this.deviceTags.createTag(AUTO_DISCOVERED_TAG);
      return created.id;
    } catch (err) {
      // Lost a race with another concurrent scan completion -- the tag
      // exists now even though it didn't a moment ago.
      if (err instanceof BadRequestException) {
        const retry = (await this.deviceTags.listTags()).find(
          (t) => t.key === AUTO_DISCOVERED_TAG.key,
        );
        if (retry) return retry.id;
      }
      throw err;
    }
  }
}
