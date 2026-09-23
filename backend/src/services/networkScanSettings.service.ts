import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';

const KEY = 'network_scan_config';

export type NetworkScanConfig = {
  /** Whether a network_scan result with no matching existing device gets
   * auto-created as a new Devices row (tagged "auto-discovered"). Off
   * just means the host stays an unlinked IpAllocation row in IPAM --
   * see DeviceDiscoveryService.ingestScanResults(). Defaults to true to
   * keep today's behavior unless an admin turns it off. */
  autoCreateDevices: boolean;
};

const DEFAULT_CONFIG: NetworkScanConfig = { autoCreateDevices: true };

@Injectable()
export class NetworkScanSettingsService {
  constructor(
    @InjectRepository(AdminSettings)
    private readonly repo: Repository<AdminSettings>,
  ) {}

  async getConfig(): Promise<NetworkScanConfig> {
    const record = await this.repo.findOne({ where: { key: KEY } });
    const value = (record?.value as Partial<NetworkScanConfig>) ?? {};
    return {
      autoCreateDevices:
        value.autoCreateDevices ?? DEFAULT_CONFIG.autoCreateDevices,
    };
  }

  async saveConfig(
    input: Partial<NetworkScanConfig>,
  ): Promise<NetworkScanConfig> {
    const current = await this.getConfig();
    const value: NetworkScanConfig = {
      autoCreateDevices: input.autoCreateDevices ?? current.autoCreateDevices,
    };

    const existing = await this.repo.findOne({ where: { key: KEY } });
    if (existing) {
      existing.value = value;
      await this.repo.save(existing);
    } else {
      await this.repo.insert({ id: uuidv4(), key: KEY, value: value as any });
    }
    return value;
  }
}
