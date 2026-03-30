export type HistoryType = 0 | 1 | 2 | 3 | 4;

export interface HistoryEntry {
  id: string;
  type: HistoryType;
  date: string;
  ticket?: string;
  deviceId?: string;
  device?: { manufacturer: string; model: string; serialNumber: string };
  user?: { distinguishedName: string };
  owner?: string;
  details?: string;
  justification?: string;
  isUserFault?: boolean;
  damages?: string;
  fixes?: string;
  approvers?: { user: { id: string; distinguishedName: string } }[];
  removedComponents?: HistoryComponent[];
  addedComponents?: string[];
}

export interface HistoryComponent {
  subgroup: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  type: "remove" | "add";
  deviceId?: string;
}
