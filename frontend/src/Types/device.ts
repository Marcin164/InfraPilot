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
};

export interface DeviceFilter {
  group?: string[];
  subgroup?: string[];
  location?: string[];
}
