/**
 * Best-effort MAC vendor lookup -- a small starter set of OUI prefixes
 * (first 3 octets) for the vendors that actually matter for
 * classifyDiscoveredHost() (classifyDevice.ts), not an exhaustive OUI
 * database. Extend as needed; unknown prefixes just return null.
 */

const NETWORK_VENDOR_OUIS: Record<string, string> = {
  '00:1B:D4': 'Cisco',
  '00:1A:A1': 'Cisco',
  '58:AC:78': 'Cisco',
  '00:26:99': 'Ubiquiti',
  '24:A4:3C': 'Ubiquiti',
  '78:8A:20': 'Ubiquiti',
  'FC:EC:DA': 'Ubiquiti',
  '4C:5E:0C': 'MikroTik',
  'D4:CA:6D': 'MikroTik',
  '64:D1:54': 'TP-Link',
  '50:C7:BF': 'TP-Link',
  'A0:F3:C1': 'TP-Link',
  'A4:2B:B0': 'Netgear',
  '9C:D6:43': 'Netgear',
  '00:24:B2': 'Netgear',
  '00:0B:86': 'Aruba/HPE',
  '20:4C:03': 'Aruba/HPE',
  '9C:1C:12': 'Aruba/HPE',
  '00:19:CB': 'Juniper',
  '3C:8A:B0': 'Juniper',
  '00:19:5B': 'D-Link',
  '00:1B:11': 'D-Link',
  '00:19:70': 'Zyxel',
  '00:13:49': 'Zyxel',
};

const COMPUTER_VENDOR_OUIS: Record<string, string> = {
  '18:34:AF': 'Dell',
  'F8:B1:56': 'Dell',
  '00:14:22': 'Dell',
  '54:9F:35': 'Lenovo',
  '00:21:CC': 'Lenovo',
  '3C:52:82': 'HP Inc',
  '00:1F:29': 'HP Inc',
  '00:1B:63': 'Apple',
  '28:CF:E9': 'Apple',
  '3C:15:C2': 'Apple',
  '00:15:5D': 'Microsoft (Hyper-V)',
  '00:1C:42': 'Parallels',
  '08:00:27': 'VirtualBox',
  '00:50:56': 'VMware',
  '00:0C:29': 'VMware',
};

const PRINTER_VENDOR_OUIS: Record<string, string> = {
  '00:80:77': 'Brother',
  '30:05:5C': 'Brother',
  '00:00:74': 'Canon',
  '00:1E:8F': 'Canon',
  '00:00:48': 'Epson',
  '64:EB:8C': 'Epson',
  '00:07:4D': 'Zebra',
  '00:80:92': 'Xerox',
};

const ALL_OUIS: Record<string, string> = {
  ...NETWORK_VENDOR_OUIS,
  ...COMPUTER_VENDOR_OUIS,
  ...PRINTER_VENDOR_OUIS,
};

function normalizeOui(mac: string): string | null {
  const hex = mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (hex.length < 6) return null;
  const oui = hex.slice(0, 6);
  return `${oui.slice(0, 2)}:${oui.slice(2, 4)}:${oui.slice(4, 6)}`;
}

export function lookupVendor(mac: string): string | null {
  const oui = normalizeOui(mac);
  if (!oui) return null;
  return ALL_OUIS[oui] ?? null;
}

export function isKnownNetworkVendor(mac: string): boolean {
  const oui = normalizeOui(mac);
  if (!oui) return false;
  return oui in NETWORK_VENDOR_OUIS;
}
