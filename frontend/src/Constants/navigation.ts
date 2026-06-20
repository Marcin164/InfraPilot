import {
  faAddressBook,
  faBookAtlas,
  faBell,
  faBolt,
  faBoxArchive,
  faBug,
  faBuilding,
  faCalendar,
  faChartBar,
  faCircleInfo,
  faClockRotateLeft,
  faChartPie,
  faCloud,
  faCode,
  faComputer,
  faEnvelope,
  faGaugeHigh,
  faComputerMouse,
  faGear,
  faHardDrive,
  faHistory,
  faKey,
  faNetworkWired,
  faPaste,
  faPlay,
  faQrcode,
  faRobot,
  faShield,
  faShieldHalved,
  faShoppingCart,
  faTag,
  faTicket,
  faUser,
  faUserTag,
  faUsers,
  faWindowMaximize,
  faWrench,
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
    to: "/admin/licenses",
    label: "nav.licenses",
    icon: faKey,
    requires: "helpdeskOrAdmin" as NavbarRequirement,
  },
  {
    to: "/admin/procurement",
    label: "nav.procurement",
    icon: faShoppingCart,
    requires: "helpdeskOrAdmin" as NavbarRequirement,
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

// `scope` decides which device records get which tab:
//   "computers" -- only meaningful with agent scan data (Windows today)
//   "all"       -- generic asset bookkeeping, works for any record
//   "other"     -- only for manually-tracked, non-scanned records
//                  (Components/Peripherals/Network/Other groups)
// See DeviceNavbar.tsx for the filtering and Details.tsx for the
// scope-aware default-tab redirect.
export const deviceNavbarItems = [
  { to: "overview", label: "device.tab.overview", icon: faCircleInfo, scope: "other" as const },
  { to: "system", label: "device.tab.system", icon: faAddressBook, scope: "computers" as const },
  { to: "hardware", label: "device.tab.hardware", icon: faHardDrive, scope: "computers" as const },
  { to: "software", label: "device.tab.software", icon: faCode, scope: "computers" as const },
  { to: "network", label: "device.tab.network", icon: faNetworkWired, scope: "computers" as const },
  { to: "security", label: "device.tab.security", icon: faShield, scope: "computers" as const },
  { to: "events", label: "device.tab.events", icon: faCalendar, scope: "computers" as const },
  { to: "users", label: "device.tab.users", icon: faUsers, scope: "computers" as const },
  { to: "peripherals", label: "device.tab.peripherals", icon: faComputerMouse, scope: "computers" as const },
  { to: "history", label: "device.tab.history", icon: faUserTag, scope: "all" as const },
  { to: "compliance", label: "device.tab.compliance", icon: faShieldHalved, scope: "computers" as const },
  { to: "cves", label: "device.tab.cves", icon: faBug, scope: "computers" as const },
  { to: "lifecycle", label: "device.tab.lifecycle", icon: faBoxArchive, scope: "all" as const },
  { to: "tasks", label: "device.tab.tasks", icon: faPlay, scope: "computers" as const },
  { to: "scans", label: "device.tab.scans", icon: faClockRotateLeft, scope: "computers" as const },
  { to: "label", label: "device.tab.label", icon: faQrcode, scope: "all" as const },
  { to: "maintenance", label: "device.tab.maintenance", icon: faWrench, scope: "all" as const },
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
  { to: "locations", label: "settings.tab.locations", icon: faBuilding, requires: "admin" as NavbarRequirement },
  { to: "smtp", label: "settings.tab.smtp", icon: faEnvelope, requires: "admin" as NavbarRequirement },
  { to: "m365", label: "settings.tab.m365", icon: faCloud, requires: "admin" as NavbarRequirement },
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
