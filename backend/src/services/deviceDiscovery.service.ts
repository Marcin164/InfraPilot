import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Devices } from 'src/entities/devices.entity';
import {
  IpAllocation,
  IpAllocationSource,
} from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';
import { NetworkLinkType } from 'src/entities/networkConnection.entity';
import { DeviceTagsService } from 'src/services/deviceTags.service';
import { NetworkScanSettingsService } from 'src/services/networkScanSettings.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { NetworkConnectionsService } from 'src/services/networkConnections.service';
import { uuidv4 } from 'src/helpers/uuidv4';
import { classifyDiscoveredHost } from 'src/helpers/classifyDevice';

const AUTO_LINK_NOTE =
  'Auto-linked by network scan (same subnet, via gateway/network-gear heuristic) -- inferred from discovery, not a confirmed physical connection. Edit or delete as needed.';

/** Hub-candidate preference when no subnet gateway resolves to a known
 * device -- routers/switches are the most plausible anchor point for
 * everything else found on the same subnet. */
const HUB_SUBGROUP_PRIORITY = ['Router', 'Switch', 'Firewall', 'AP'];

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
    private readonly networkScanSettings: NetworkScanSettingsService,
    private readonly notificationDispatcher: NotificationDispatcherService,
    private readonly networkConnections: NetworkConnectionsService,
  ) {}

  /**
   * Turns network_scan results into real Devices rows -- matching an
   * already-known device by MAC when possible (so an enrolled agent's
   * own subnet never gets a duplicate entry for itself; this always
   * happens regardless of the setting below), otherwise creating a new,
   * best-effort-classified row tagged "auto-discovered" so it's easy to
   * bulk-review later -- unless an admin has turned that off in Settings
   * > Network scanning, in which case the host is just left unlinked
   * (still visible in IPAM, same as before this feature existed). See
   * classifyDevice.ts for how group/subgroup is guessed -- it's a guess,
   * not a confirmed identity.
   */
  async ingestScanResults(
    hosts: DiscoveredHost[],
    subnetId: string | null,
  ): Promise<void> {
    const subnet = subnetId
      ? await this.subnets.findOneBy({ id: subnetId })
      : null;
    const locationId = subnet?.locationId ?? null;
    const { autoCreateDevices } = await this.networkScanSettings.getConfig();
    const autoDiscoveredTagId = autoCreateDevices
      ? await this.findOrCreateAutoDiscoveredTag()
      : null;

    const created: Array<{ id: string; assetName: string }> = [];
    const resolvedDeviceIds = new Set<string>();

    for (const host of hosts) {
      if (!host.mac) continue; // nothing to key an identity on

      try {
        const existing = await this.findByMac(host.mac);
        let deviceId: string | null = existing?.id ?? null;
        if (!deviceId && autoCreateDevices && autoDiscoveredTagId) {
          deviceId = await this.createDevice(
            host,
            locationId,
            autoDiscoveredTagId,
          );
          created.push({ id: deviceId, assetName: host.hostname || host.ip });
        }
        if (!deviceId) continue; // nothing changed for this host

        resolvedDeviceIds.add(deviceId);
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

    if (created.length > 0) {
      await this.notifyNewDevices(created);
    }

    if (resolvedDeviceIds.size > 1) {
      await this.autoLinkDiscoveredDevices(
        subnetId,
        subnet?.gateway ?? null,
        Array.from(resolvedDeviceIds),
      );
    }
  }

  /**
   * Best-effort topology wiring: every device this scan resolved on a
   * subnet gets connected to a single "hub" (the subnet's gateway device
   * if known, otherwise the first router/switch/firewall/AP found in this
   * same batch) so scanned equipment shows up on the Topology page without
   * an admin having to cable it in by hand. This is a guess from ARP/ping
   * data only -- there's no LLDP/SNMP telling us the *real* physical
   * wiring -- so links are tagged distinctly (linkType "other" + a note,
   * createdBy "system:network-scan") and are safe to edit/delete. Skips
   * silently if no hub can be identified (nothing reliable to anchor to).
   */
  private async autoLinkDiscoveredDevices(
    subnetId: string | null,
    gateway: string | null,
    deviceIds: string[],
  ): Promise<void> {
    try {
      const hubId = await this.resolveHubDevice(subnetId, gateway, deviceIds);
      if (!hubId) return;

      for (const deviceId of deviceIds) {
        if (deviceId === hubId) continue;
        try {
          if (await this.networkConnections.existsBetween(hubId, deviceId)) {
            continue; // already documented, manually or from a prior scan
          }
          await this.networkConnections.create(
            {
              sourceDeviceId: hubId,
              targetDeviceId: deviceId,
              linkType: NetworkLinkType.OTHER,
              notes: AUTO_LINK_NOTE,
            },
            'system:network-scan',
          );
        } catch (err) {
          if (err instanceof BadRequestException) continue; // lost a race, already linked
          this.logger.warn(
            `Failed to auto-link device ${deviceId} to hub ${hubId}: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to auto-link scanned devices for subnet ${subnetId ?? 'unknown'}: ${(err as Error).message}`,
      );
    }
  }

  private async resolveHubDevice(
    subnetId: string | null,
    gateway: string | null,
    deviceIds: string[],
  ): Promise<string | null> {
    if (subnetId && gateway) {
      const gatewayAllocations = await this.allocations.find({
        where: { subnetId, ip: gateway },
      });
      const gatewayDeviceId = gatewayAllocations.find((a) => a.deviceId)
        ?.deviceId;
      if (gatewayDeviceId) return gatewayDeviceId;
    }

    const networkGear = await this.devices.find({
      where: { id: In(deviceIds), group: 'Network' },
    });
    if (networkGear.length === 0) return null;

    const rank = (subgroup: string | null) => {
      const idx = HUB_SUBGROUP_PRIORITY.indexOf(subgroup ?? '');
      return idx === -1 ? HUB_SUBGROUP_PRIORITY.length : idx;
    };
    networkGear.sort((a, b) => rank(a.subgroup) - rank(b.subgroup));
    return networkGear[0].id;
  }

  /** One notification per scan, not per device -- a scan that finds a
   * dozen new hosts at once shouldn't spam a dozen separate alerts. */
  private async notifyNewDevices(
    created: Array<{ assetName: string }>,
  ): Promise<void> {
    try {
      await this.notificationDispatcher.dispatchOpsAlert({
        event: 'device_auto_discovered',
        title: `${created.length} new device(s) discovered`,
        body: `Network scan created: ${created.map((d) => d.assetName).join(', ')}.`,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to dispatch device_auto_discovered alert: ${(err as Error).message}`,
      );
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
