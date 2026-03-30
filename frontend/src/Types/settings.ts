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
}
