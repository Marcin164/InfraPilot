/** Plain bit-math IPv4/CIDR helpers -- no external dependency needed. */

export function ipToInt(ip: string): number {
  const parts = ip.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function intToIp(int: number): string {
  return [24, 16, 8, 0].map((shift) => (int >>> shift) & 255).join('.');
}

export type CidrRange = {
  /** First address in the block (network address). */
  start: number;
  /** Last address in the block (broadcast address). */
  end: number;
  /** Total addresses in the block, inclusive. */
  total: number;
  prefix: number;
};

export function cidrRange(cidr: string): CidrRange {
  const [ip, prefixStr] = cidr.trim().split('/');
  const prefix = Number(prefixStr);
  if (!ip || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid CIDR: ${cidr}`);
  }
  const base = ipToInt(ip);
  const hostBits = 32 - prefix;
  const mask = hostBits === 32 ? 0 : (0xffffffff << hostBits) >>> 0;
  const start = (base & mask) >>> 0;
  const total = 2 ** hostBits;
  const end = (start + total - 1) >>> 0;
  return { start, end, total, prefix };
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const { start, end } = cidrRange(cidr);
    const val = ipToInt(ip);
    return val >= start && val <= end;
  } catch {
    return false;
  }
}
