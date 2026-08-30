import { DhcpDriverType, DhcpServer } from 'src/entities/dhcpServer.entity';
import { ParsedLeaseRecord } from 'src/helpers/leaseTemplate';

export type RawLeaseRecord = ParsedLeaseRecord;

/**
 * One implementation per `DhcpDriverType`. Each driver owns how it connects
 * (SSH, REST, WinRM, ...) -- callers (LeaseSyncService) only care that it
 * returns lease records for a given DhcpServer row.
 */
export interface DhcpLeaseDriver {
  readonly type: DhcpDriverType;
  fetchLeases(source: DhcpServer): Promise<RawLeaseRecord[]>;
}

export const DHCP_LEASE_DRIVERS = 'DHCP_LEASE_DRIVERS';
