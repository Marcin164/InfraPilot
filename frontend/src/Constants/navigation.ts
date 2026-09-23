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
  faComputerMouse,
  faDatabase,
  faGear,
  faHardDrive,
  faHistory,
  faKey,
  faLayerGroup,
  faLocationDot,
  faMagnifyingGlass,
  faNetworkWired,
  faPaste,
  faPlay,
  faQrcode,
  faRobot,
  faServer,
  faShield,
  faSitemap,
  faShieldHalved,
  faShoppingCart,
  faSquareCheck,
  faTag,
  faTicket,
  faUser,
  faUserTag,
  faUsers,
  faWindowMaximize,
  faWrench,
  faRetweet,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

// A permission requirement is one or more catalog codes (see
// backend/src/decorators/permissions.catalog.ts) — OR semantics, same as
// the backend's @RequiresPermission(...). No requirement = visible to any
// authenticated user, staff or not (unchanged from the old system).
export type PermissionRequirement = string | string[];

export type NavbarItem = {
  to: string;
  label: string;
  icon: any;
  requires?: PermissionRequirement;
};

// "Staff" bucket for things that should be visible to anyone holding at
// least one elevated permission, not a specific one — mirrors the backend's
// own STAFF_PERMISSIONS list in helpers/isStaffUser.ts. Used for the old
// "anyRole" requirement (e.g. "show the switch-to-admin link").
export const STAFF_PERMISSIONS: PermissionRequirement = [
  "helpdesk.tickets.access",
  "audit.fullAccess",
  "devices.complianceRules.manage",
  "helpdesk.approver",
  "dpo.fullAccess",
];

// Core check, usable directly on a page component
// (`hasPermission("admin.locations.config", permissionsQuery.data)`)
// without needing a full NavbarItem — pages don't have a
// `to`/`label`/`icon` to construct one. `permissions` comes from
// usePermissions() and is undefined only while that query hasn't
// resolved yet (or the user isn't logged in), not for a genuinely
// permission-less user (which resolves to an empty array).
export const hasPermission = (
  requires: PermissionRequirement | undefined,
  permissions: string[] | undefined,
): boolean => {
  if (!requires) return true;
  if (!permissions) return false;
  const required = Array.isArray(requires) ? requires : [requires];
  return required.some((code) => permissions.includes(code));
};

export const canSeeItem = (
  item: NavbarItem,
  permissions: string[] | undefined,
) => hasPermission(item.requires, permissions);

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
    to: "/admin/map",
    label: "nav.map",
    icon: faGlobe,
  },
  {
    to: "/admin/shifts",
    label: "Shifts",
    icon: faCalendar
  },
  {
    to: "/admin/topology",
    label: "nav.topology",
    icon: faNetworkWired,
  },
  {
    to: "/admin/ipam",
    label: "nav.ipam",
    icon: faSitemap,
  },
  {
    to: "/admin/dhcp-servers",
    label: "nav.dhcpServers",
    icon: faServer,
  },
  {
    to: "/admin/licenses",
    label: "nav.licenses",
    icon: faKey,
    requires: "licenses.view",
  },
  {
    to: "/admin/procurement",
    label: "nav.procurement",
    icon: faShoppingCart,
    requires: "procurement.view",
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
    requires: "helpdesk.approver",
  },
  {
    to: "/admin/audit",
    label: "nav.audit",
    icon: faBookAtlas,
    requires: "audit.fullAccess",
  },
  {
    to: "/admin/privacy",
    label: "nav.privacy",
    icon: faUser,
    requires: "dpo.fullAccess",
  },
  {
    to: "/admin/settings/personal",
    label: "nav.settings",
    icon: faGear,
  },
  {
    to: "/user/account",
    label: "nav.switchToUser",
    icon: faRetweet,
  },
];

// Rendered by the user portal navbar (Pages/User/components/UserNavbar.tsx),
// which keeps its own item list rather than reading `navbarItems` above.
// Only shown to users who hold an elevated role (see `canSeeItem`/"anyRole").
export const userPortalExtraItems: NavbarItem[] = [
  {
    to: "/user/approvals",
    label: "nav.approvals",
    icon: faSquareCheck,
    requires: "helpdesk.approver",
  },
  {
    to: "/admin/dashboards",
    label: "nav.switchToAdmin",
    icon: faGear,
    requires: STAFF_PERMISSIONS,
  },
];

// `scope` decides which device records get which tab:
//   "computers"          -- only meaningful with agent scan data (Windows today)
//   "all"                -- generic asset bookkeeping, works for any record
//   "other"              -- only for manually-tracked, non-scanned records
//                            (Components/Peripherals/Network/Other groups)
//   "computersOrNetwork" -- only things that can plausibly be cabled/linked
//                            to something else (endpoints + network gear) --
//                            excludes Components/Peripherals/Other (a spare
//                            RAM stick or a mouse has no "connections")
//   "network"            -- Network group only (switches/routers/APs/
//                            firewalls) -- SSH config backup isn't
//                            meaningful for an endpoint laptop
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
  { to: "connections", label: "device.tab.connections", icon: faNetworkWired, scope: "computersOrNetwork" as const },
  { to: "backup", label: "device.tab.backup", icon: faDatabase, scope: "network" as const },
  { to: "compliance", label: "device.tab.compliance", icon: faShieldHalved, scope: "computers" as const },
  { to: "cves", label: "device.tab.cves", icon: faBug, scope: "computers" as const },
  { to: "location", label: "device.tab.location", icon: faLocationDot, scope: "all" as const },
  { to: "lifecycle", label: "device.tab.lifecycle", icon: faBoxArchive, scope: "all" as const },
  { to: "tasks", label: "device.tab.tasks", icon: faPlay, scope: "computers" as const },
  { to: "scans", label: "device.tab.scans", icon: faClockRotateLeft, scope: "computers" as const },
  { to: "label", label: "device.tab.label", icon: faQrcode, scope: "all" as const },
  { to: "maintenance", label: "device.tab.maintenance", icon: faWrench, scope: "all" as const },
];

export const settingsNavbarItems = [
  { to: "personal", label: "settings.tab.personal", icon: faAddressBook },
  { to: "active-directory", label: "settings.tab.activeDirectory", icon: faNetworkWired, requires: "admin.activeDirectory.config" },
  { to: "m365", label: "settings.tab.m365", icon: faCloud, requires: "admin.o365.config" },
  { to: "licenses", label: "settings.tab.licenseSync", icon: faKey, requires: "licenses.integrations.manage" },
  { to: "sla", label: "settings.tab.sla", icon: faCalendar },
  { to: "workflows", label: "settings.tab.workflows", icon: faBolt },
  { to: "categories", label: "settings.tab.categories", icon: faLayerGroup },
  { to: "notifications", label: "settings.tab.notifications", icon: faBell },
  { to: "admin", label: "settings.tab.admin", icon: faShield, requires: "admin.roleAssignment.manage" },
  { to: "retention", label: "settings.tab.retention", icon: faBoxArchive, requires: "dpo.retentionPolicy.config" },
  { to: "tags", label: "settings.tab.tags", icon: faTag, requires: "devices.tags.manage" },
  { to: "compliance-rules", label: "settings.tab.complianceRules", icon: faShieldHalved, requires: "devices.complianceRules.manage" },
  { to: "ticket-templates", label: "settings.tab.ticketTemplates", icon: faPaste, requires: "helpdesk.ticketTemplates.manage" },
  { to: "agent", label: "settings.tab.windowsAgent", icon: faWindowMaximize, requires: "devices.agentConfig.manage" },
  { to: "network-scan", label: "settings.tab.networkScan", icon: faMagnifyingGlass, requires: "devices.agentConfig.manage" },
  { to: "locations", label: "settings.tab.locations", icon: faBuilding, requires: "admin.locations.config" },
  { to: "smtp", label: "settings.tab.smtp", icon: faEnvelope, requires: "admin.smtp.config" },
];

import type { ReportCategory } from "../Services/reports";

export const reportsNavbarItems = [
  { to: "users", label: "reports.tab.users", icon: faUsers },
  { to: "devices", label: "reports.tab.devices", icon: faComputerMouse },
  { to: "tickets", label: "reports.tab.tickets", icon: faTicket },
  { to: "security", label: "reports.tab.security", icon: faShield },
  { to: "licenses", label: "reports.tab.licenses", icon: faKey },
  { to: "network", label: "reports.tab.network", icon: faNetworkWired },
  { to: "knowledge", label: "reports.tab.knowledge", icon: faBookAtlas },
];

// Single source of truth mapping each Reports page route to the report
// categories it should render. Both ReportsNavbar and the Details/*.tsx pages
// read from this, so adding a category in one place propagates everywhere.
export const reportPageCategories: Record<string, ReportCategory[]> = {
  users: ["users", "forms"],
  devices: ["devices", "applications", "histories"],
  tickets: ["tickets", "sla"],
  security: ["security", "audit", "retention"],
  licenses: ["licenses", "procurement"],
  network: ["ipam", "network", "fleet"],
  knowledge: ["knowledge"],
};
