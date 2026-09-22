import { isKnownNetworkVendor } from './ouiLookup';

export type DiscoveredHostClassification = {
  group: string;
  subgroup: string | null;
};

const PRINTER_PORTS = [631, 9100];
const WINDOWS_PORTS = [445, 3389];
const NETWORK_MGMT_PORTS = [22, 80, 443];

/**
 * Best-effort classification from credential-less signals only (open
 * TCP ports from discovery.py's port scan + MAC OUI vendor) -- ports are
 * checked first since they're a stronger signal than vendor (e.g. a
 * known network-gear vendor making a printer's NIC chipset would
 * otherwise get misfiled). Falls back to the app's own "Other" taxonomy
 * bucket rather than a confident-looking guess when nothing is
 * conclusive -- see frontend/src/Constants/options.ts for the full
 * group/subgroup taxonomy this must stay compatible with.
 */
export function classifyDiscoveredHost(input: {
  mac?: string | null;
  openPorts?: number[] | null;
}): DiscoveredHostClassification {
  const ports = new Set(input.openPorts ?? []);
  const hasAny = (list: number[]) => list.some((p) => ports.has(p));

  if (hasAny(PRINTER_PORTS)) {
    return { group: 'Peripherals', subgroup: 'Printer' };
  }
  if (hasAny(WINDOWS_PORTS)) {
    return { group: 'Computers', subgroup: 'PC' };
  }

  const knownNetworkVendor = input.mac
    ? isKnownNetworkVendor(input.mac)
    : false;
  if (hasAny(NETWORK_MGMT_PORTS) && knownNetworkVendor) {
    return { group: 'Network', subgroup: 'Switch' };
  }
  if (knownNetworkVendor) {
    return { group: 'Network', subgroup: null };
  }

  return { group: 'Other', subgroup: 'Other' };
}
