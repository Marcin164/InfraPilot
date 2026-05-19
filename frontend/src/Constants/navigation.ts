import {
  faAddressBook,
  faBookAtlas,
  faBell,
  faBolt,
  faBoxArchive,
  faBug,
  faCalendar,
  faChartBar,
  faClockRotateLeft,
  faChartPie,
  faCode,
  faComputer,
  faGaugeHigh,
  faComputerMouse,
  faGear,
  faHardDrive,
  faHistory,
  faNetworkWired,
  faPaste,
  faPlay,
  faRobot,
  faShield,
  faShieldHalved,
  faTag,
  faTicket,
  faUser,
  faUsers,
  faWindowMaximize,
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
    to: "/admin/fleet",
    label: "nav.fleet.title",
    icon: faGaugeHigh,
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
  { to: "system", label: "device.tab.system", icon: faAddressBook },
  { to: "hardware", label: "device.tab.hardware", icon: faHardDrive },
  { to: "software", label: "device.tab.software", icon: faCode },
  { to: "network", label: "device.tab.network", icon: faNetworkWired },
  { to: "security", label: "device.tab.security", icon: faShield },
  { to: "events", label: "device.tab.events", icon: faCalendar },
  { to: "users", label: "device.tab.users", icon: faUsers },
  { to: "peripherals", label: "device.tab.peripherals", icon: faComputerMouse },
  { to: "history", label: "device.tab.history", icon: faHistory },
  { to: "compliance", label: "device.tab.compliance", icon: faShieldHalved },
  { to: "cves", label: "device.tab.cves", icon: faBug },
  { to: "lifecycle", label: "device.tab.lifecycle", icon: faBoxArchive },
  { to: "tasks", label: "device.tab.tasks", icon: faPlay },
  { to: "scans", label: "device.tab.scans", icon: faClockRotateLeft },
];

export const settingsNavbarItems = [
  { to: "personal", label: "settings.tab.personal", icon: faAddressBook },
  { to: "active-directory", label: "settings.tab.activeDirectory", icon: faNetworkWired },
  { to: "sla", label: "settings.tab.sla", icon: faCalendar },
  { to: "workflows", label: "settings.tab.workflows", icon: faBolt },
  { to: "notifications", label: "settings.tab.notifications", icon: faBell },
  { to: "admin", label: "settings.tab.admin", icon: faShield, requires: "admin" as NavbarRequirement },
  { to: "audit", label: "settings.tab.audit", icon: faBookAtlas, requires: "auditorOrAdmin" as NavbarRequirement },
  { to: "retention", label: "settings.tab.retention", icon: faShield, requires: "complianceOrAdmin" as NavbarRequirement },
  { to: "privacy", label: "settings.tab.privacy", icon: faUser, requires: "dpoOrAdmin" as NavbarRequirement },
  { to: "tags", label: "settings.tab.tags", icon: faTag, requires: "admin" as NavbarRequirement },
  { to: "compliance-rules", label: "settings.tab.complianceRules", icon: faShieldHalved, requires: "complianceOrAdmin" as NavbarRequirement },
  { to: "ticket-templates", label: "settings.tab.ticketTemplates", icon: faPaste, requires: "helpdeskOrAdmin" as NavbarRequirement },
  { to: "windows-agent", label: "settings.tab.windowsAgent", icon: faWindowMaximize, requires: "admin" as NavbarRequirement },
];

import type { ReportCategory } from "../Services/reports";

export const reportsNavbarItems = [
  { to: "users", label: "reports.tab.users", icon: faUsers },
  { to: "devices", label: "reports.tab.devices", icon: faComputerMouse },
  { to: "tickets", label: "reports.tab.tickets", icon: faTicket },
  { to: "security", label: "reports.tab.security", icon: faShield },
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
