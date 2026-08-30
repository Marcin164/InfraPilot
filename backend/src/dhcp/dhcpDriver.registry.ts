import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DhcpDriverType } from 'src/entities/dhcpServer.entity';
import { DHCP_LEASE_DRIVERS, DhcpLeaseDriver } from './dhcpLeaseDriver.interface';

/**
 * Looks up the right driver by `DhcpServer.driverType`. New drivers (Kea,
 * Windows/WinRM, ...) register themselves by being added to the
 * DHCP_LEASE_DRIVERS provider in devices.module.ts -- nothing here changes.
 */
@Injectable()
export class DhcpDriverRegistry {
  constructor(@Inject(DHCP_LEASE_DRIVERS) private readonly drivers: DhcpLeaseDriver[]) {}

  getDriver(type: DhcpDriverType): DhcpLeaseDriver {
    const driver = this.drivers.find((d) => d.type === type);
    if (!driver) throw new BadRequestException(`No driver registered for type "${type}"`);
    return driver;
  }
}
