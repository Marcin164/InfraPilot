export type DashboardWidgetConfig = {
  id: string; // unikalny klucz
  label: string; // tekst w UI
  component: string; // mapowany komponent
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

export const DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: "733b7571-b65d-4e63-bbf3-d2deea569b0b",
    label: "Active users",
    component: "ActiveUsers",
    w: 3,
    h: 2,
  },
  {
    id: "e6c96c89-75be-4bc8-8f3c-1db36214a4ad",
    label: "Active devices",
    component: "ActiveDevices",
    w: 3,
    h: 2,
  },
  {
    id: "b66b5c95-181b-4412-9ba9-dbd716d93cbb",
    label: "Bitlocker compliance",
    component: "BitlockerCompliance",
    w: 3,
    h: 5,
  },
  {
    id: "f65f5dd1-f822-470a-99aa-023d070ba5c3",
    label: "Last scan",
    component: "LastScan",
    w: 6,
    h: 6,
  },
];
