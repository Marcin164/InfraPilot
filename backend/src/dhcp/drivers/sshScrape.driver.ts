import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeSSH } from 'node-ssh';
import { DhcpDriverType, DhcpServer } from 'src/entities/dhcpServer.entity';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { Devices } from 'src/entities/devices.entity';
import { decrypt } from 'src/helpers/crypto';
import { compileLeaseTemplate, parseLeaseOutput } from 'src/helpers/leaseTemplate';
import { DhcpLeaseDriver, RawLeaseRecord } from '../dhcpLeaseDriver.interface';

/**
 * Connects over SSH to the linked `Devices` row, runs `config.command`, and
 * parses the output with `config.lineTemplate` -- this is the original
 * lease-sync mechanism (MikroTik `/ip dhcp-server lease print`, dnsmasq
 * `cat .../dnsmasq.leases`, etc.), unchanged from before the DhcpServer
 * abstraction existed. It reuses NetworkDeviceCredential's already-encrypted
 * SSH creds instead of storing its own.
 */
@Injectable()
export class SshScrapeDriver implements DhcpLeaseDriver {
  readonly type = DhcpDriverType.SSH_SCRAPE;

  constructor(
    @InjectRepository(NetworkDeviceCredential)
    private readonly credentials: Repository<NetworkDeviceCredential>,
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
  ) {}

  async fetchLeases(source: DhcpServer): Promise<RawLeaseRecord[]> {
    if (!source.deviceId) {
      throw new BadRequestException('ssh_scrape source has no linked device');
    }
    const device = await this.devices.findOneBy({ id: source.deviceId });
    if (!device) throw new BadRequestException('Device not found');
    if (!device.managementIp) throw new BadRequestException('Device has no management IP set');

    const cred = await this.credentials.findOneBy({ deviceId: source.deviceId });
    if (!cred) throw new BadRequestException('No SSH credential configured for this device');

    const command = source.config?.command as string | undefined;
    const lineTemplate = source.config?.lineTemplate as string | undefined;
    if (!command || !lineTemplate) {
      throw new BadRequestException('ssh_scrape source is missing command/lineTemplate config');
    }

    const compiled = compileLeaseTemplate(lineTemplate);

    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: device.managementIp,
        username: decrypt(cred.sshUsername),
        password: cred.sshPassword ? decrypt(cred.sshPassword) : undefined,
        port: cred.sshPort,
        readyTimeout: 10000,
      });
      const result = await ssh.execCommand(command);
      return parseLeaseOutput(result.stdout, compiled);
    } finally {
      ssh.dispose();
    }
  }
}
