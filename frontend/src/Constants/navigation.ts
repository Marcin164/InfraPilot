import {
  faAddressBook,
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
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export const navbarItems = [
  {
    to: "/dashboards",
    label: "nav.dashboards",
    icon: faChartPie,
  },
  {
    to: "/users",
    label: "nav.users",
    icon: faUsers,
  },
  {
    to: "/devices",
    label: "nav.devices",
    icon: faComputer,
  },
  {
    to: "/helpdesk",
    label: "nav.helpdesk",
    icon: faRobot,
  },
  {
    to: "/reports",
    label: "nav.reports",
    icon: faChartBar,
  },
  {
    to: "/history",
    label: "nav.history",
    icon: faHistory,
  },
  {
    to: "/settings",
    label: "nav.settings",
    icon: faGear,
  },
];

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
];
