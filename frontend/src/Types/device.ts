export interface Device {
  id: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  assetName?: string;
  group: DeviceGroup;
  subgroup: string;
  location: string;
  state?: boolean;
  varranty?: number;
  user?: { id: string; distinguishedName: string };
  userId?: string;
  data?: DeviceData;
  /** "windows" | "darwin" -- set by the agent at enrollment; null for devices added manually. */
  platform?: string | null;
  apiSecretRotatedAt?: string | null;
  apiSecretPrevValidUntil?: string | null;
  lastScanAt?: string | null;
  locationId?: string | null;
  managementIp?: string | null;
  portCount?: number | null;
  firmwareVersion?: string | null;
  macAddress?: string | null;
  pingStatus?: "unknown" | "up" | "down";
  lastPingAt?: string | null;
}

export type DeviceGroup = "Computers" | "Peripherals" | "Network" | "Components" | "Other";

export interface DeviceData {
  id?: string;
  assetName?: string;
  system?: Record<string, unknown>;
  network?: Record<string, unknown>;
  hardware?: Record<string, unknown>;
  software?: unknown[];
  security?: Record<string, unknown>;
  eventLogs?: unknown[];
  users?: unknown[];
  peripherals?: Record<string, unknown>;
}

export interface DeviceOption {
  id: string;
  manufacturer: string;
  model: string;
  serialnumber: string;
}

export type CreateDeviceData = {
  group: string;
  subgroup: string;
  assetName?: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  location: string;
  locationId?: string;
  managementIp?: string;
  portCount?: number | null;
  firmwareVersion?: string;
  macAddress?: string;
};

export type UpdateDeviceDetailsData = Partial<
  Pick<
    CreateDeviceData,
    | "assetName"
    | "model"
    | "manufacturer"
    | "serialNumber"
    | "locationId"
    | "managementIp"
    | "portCount"
    | "firmwareVersion"
    | "macAddress"
  >
>;

export interface DeviceFilter {
  group?: string[];
  subgroup?: string[];
  location?: string[];
}
