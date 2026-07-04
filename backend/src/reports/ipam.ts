// IPAM REPORTS
import { cidrRange, isIpInCidr } from 'src/helpers/cidr';

/** Same conflict definition as IpamService.getConflicts(): an IP claimed by more than one distinct owner. */
export async function ipamConflictsReport({ db }) {
  const devices = await db.query(
    `SELECT id, "managementIp", network FROM devices`,
  );
  const allocations = await db.query(
    `SELECT id, ip, "deviceId", "macAddress", hostname FROM ip_allocation`,
  );

  const owners = new Map<string, Set<string>>();
  const add = (ip: string | null | undefined, ownerKey: string) => {
    if (!ip) return;
    if (!owners.has(ip)) owners.set(ip, new Set());
    owners.get(ip)!.add(ownerKey);
  };

  for (const d of devices) {
    add(d.managementIp, d.id);
    const nicConfig = (d.network as any)?.nic_config;
    if (Array.isArray(nicConfig)) {
      for (const nic of nicConfig) {
        if (nic?.IPv4Address) add(nic.IPv4Address, d.id);
      }
    }
  }

  let fallback = 0;
  for (const a of allocations) {
    const ownerKey =
      a.deviceId || a.macAddress || a.hostname || `row:${a.id}:${fallback++}`;
    add(a.ip, ownerKey);
  }

  let conflicts = 0;
  for (const set of owners.values()) if (set.size > 1) conflicts++;

  return [{ label: 'conflicts', value: conflicts }];
}

export async function ipamSubnetUtilizationReport({ db }) {
  const subnets = await db.query(
    `SELECT id, name, cidr FROM subnet ORDER BY name ASC`,
  );
  const allocations = await db.query(`SELECT ip FROM ip_allocation`);
  const devices = await db.query(
    `SELECT "managementIp", network FROM devices`,
  );

  const knownIps = new Set<string>();
  for (const a of allocations) if (a.ip) knownIps.add(a.ip);
  for (const d of devices) {
    if (d.managementIp) knownIps.add(d.managementIp);
    const nicConfig = (d.network as any)?.nic_config;
    if (Array.isArray(nicConfig)) {
      for (const nic of nicConfig) {
        if (nic?.IPv4Address) knownIps.add(nic.IPv4Address);
      }
    }
  }
  const ipList = Array.from(knownIps);

  return subnets.map((s: any) => {
    let total = 0;
    let used = 0;
    try {
      total = cidrRange(s.cidr).total;
      used = ipList.filter((ip) => isIpInCidr(ip, s.cidr)).length;
    } catch {
      total = 0;
      used = 0;
    }
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
    return { label: s.name, value: pct, used, total };
  });
}
