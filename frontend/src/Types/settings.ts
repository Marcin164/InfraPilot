export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  lastUsed?: boolean;
}

export interface UserSettings {
  theme?: "system" | "day" | "night";
  language?: string;
  notificationsEnabled?: boolean;
  notifications?: {
    history: boolean;
    devices: boolean;
    users: boolean;
  };
  usersTableColumnOrder?: string[];
  ticketsTableColumnOrder?: string[];
  devicesTableColumnOrder?: string[];
  reportsLayout?: "small" | "medium" | "large";
  filterPresets?: Record<string, FilterPreset[]>;
  lastLogonThresholds?: LastLogonThreshold[];
  lastLogonDefaultColor?: string;
}

export interface LastLogonThreshold {
  maxDays: number;
  color: string;
  label: string;
}
