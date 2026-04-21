import {
  faAddressBook,
  faBookAtlas,
  faCalendar,
  faChartBar,
  faChartPie,
  faCode,
  faComputer,
  faComputerMouse,
  faGear,
  faHardDrive,
  faHistory,
  faNetworkWired,
  faRobot,
  faShield,
  faTicket,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export type NavbarRequirement =
  | "admin"
  | "approverOrAdmin"
  | "auditorOrAdmin"
  | "complianceOrAdmin"
  | "helpdeskOrAdmin"
  | "dpoOrAdmin";

export type NavbarItem = {
  to: string;
  label: string;
  icon: any;
  requires?: NavbarRequirement;
};

export const navbarItems: NavbarItem[] = [
  {
    to: "/admin/dashboards",
    label: "nav.dashboards",
    icon: faChartPie,
  },
  {
    to: "/admin/users",
    label: "nav.users",
    icon: faUsers,
  },
  {
    to: "/admin/devices",
    label: "nav.devices",
    icon: faComputer,
  },
  {
    to: "/admin/helpdesk",
    label: "nav.helpdesk",
    icon: faRobot,
  },
  {
    to: "/admin/knowledge",
    label: "nav.knowledge",
    icon: faBookAtlas,
  },
  {
    to: "/admin/reports/users",
    label: "nav.reports",
    icon: faChartBar,
  },
  {
    to: "/admin/history",
    label: "nav.history",
    icon: faHistory,
    requires: "approverOrAdmin",
  },
  {
    to: "/admin/settings/personal",
    label: "nav.settings",
    icon: faGear,
  },
  {
    to: "/user/account",
    label: "nav.user",
    icon: faUser,
  },
  {
    to: "/user/tickets",
    label: "nav.tickets",
    icon: faTicket,
  },
  {
    to: "/user/settings",
    label: "nav.mysettings",
    icon: faGear,
  },
];

export const userNavbarPaths = new Set([
  "/user/account",
  "/user/tickets",
  "/user/settings",
]);

export const deviceNavbarItems = [
  {
    to: "system",
    label: "System",
    icon: faAddressBook,
  },
  {
    to: "hardware",
    label: "Hardware",
    icon: faHardDrive,
  },
  {
    to: "software",
    label: "Software",
    icon: faCode,
  },
  {
    to: "network",
    label: "Network",
    icon: faNetworkWired,
  },
  {
    to: "security",
    label: "Security",
    icon: faShield,
  },
  {
    to: "events",
    label: "Events",
    icon: faCalendar,
  },
  {
    to: "users",
    label: "Users",
    icon: faUsers,
  },
  {
    to: "peripherals",
    label: "Peripherals",
    icon: faComputerMouse,
  },
  {
    to: "history",
    label: "History",
    icon: faHistory,
  },
];

export const settingsNavbarItems = [
  {
    to: "personal",
    label: "Personal",
    icon: faAddressBook,
  },
  {
    to: "active-directory",
    label: "Active Directory",
    icon: faNetworkWired,
  },
  {
    to: "sla",
    label: "SLA",
    icon: faCalendar,
  },
  {
    to: "tickets",
    label: "Tickets",
    icon: faTicket,
  },
  {
    to: "admin",
    label: "Admin",
    icon: faShield,
    requires: "admin" as NavbarRequirement,
  },
  {
    to: "audit",
    label: "Audit log",
    icon: faBookAtlas,
    requires: "auditorOrAdmin" as NavbarRequirement,
  },
  {
    to: "retention",
    label: "Retention",
    icon: faShield,
    requires: "complianceOrAdmin" as NavbarRequirement,
  },
  {
    to: "privacy",
    label: "Privacy",
    icon: faUser,
    requires: "dpoOrAdmin" as NavbarRequirement,
  },
];

import type { ReportCategory } from "../Services/reports";

export const reportsNavbarItems = [
  { to: "users", label: "Users", icon: faUsers },
  { to: "devices", label: "Devices", icon: faComputerMouse },
  { to: "tickets", label: "Tickets", icon: faTicket },
  { to: "security", label: "Security", icon: faShield },
];

// Single source of truth mapping each Reports page route to the report
// categories it should render. Both ReportsNavbar and the Details/*.tsx pages
// read from this, so adding a category in one place propagates everywhere.
export const reportPageCategories: Record<string, ReportCategory[]> = {
  users: ["users", "forms"],
  devices: ["devices", "applications", "histories"],
  tickets: ["tickets", "sla"],
  security: ["security", "audit"],
};
