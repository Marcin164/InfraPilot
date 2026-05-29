export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  lastUsed?: boolean;
}

export type ThemeSetting = "light" | "dark" | "system";
export type TimeFormat = "12h" | "24h";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type StartPage =
  | "dashboards"
  | "users"
  | "devices"
  | "helpdesk"
  | "knowledge"
  | "history"
  | "reports";

export interface UserSettings {
  theme?: ThemeSetting;
  language?: string;
  startPage?: StartPage;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  defaultPageSize?: number;
  compactMode?: boolean;
  usersTableColumnOrder?: string[];
  ticketsTableColumnOrder?: string[];
  devicesTableColumnOrder?: string[];
  reportsLayout?: "small" | "medium" | "large";
  filterPresets?: Record<string, FilterPreset[]>;
  lastLogonThresholds?: LastLogonThreshold[];
  lastLogonDefaultColor?: string;
  notifEmail?: string | null;
  notifPhone?: string | null;
}

export interface LastLogonThreshold {
  maxDays: number;
  color: string;
  label: string;
}
