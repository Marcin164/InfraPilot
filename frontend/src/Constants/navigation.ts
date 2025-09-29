import {
  faCalendar,
  faChartPie,
  faCode,
  faComputer,
  faComputerMouse,
  faGear,
  faHardDrive,
  faHistory,
  faInfo,
  faNetworkWired,
  faRobot,
  faShield,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export const navbarItems = [
  {
    to: "/dashboards",
    label: "Dashboards",
    icon: faChartPie,
  },
  {
    to: "/users",
    label: "Users",
    icon: faUsers,
  },
  {
    to: "/devices",
    label: "Devices",
    icon: faComputer,
  },
  {
    to: "/applications",
    label: "Applications",
    icon: faCode,
  },
  {
    to: "/flows",
    label: "Flows",
    icon: faRobot,
  },
  {
    to: "/history",
    label: "History",
    icon: faHistory,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: faGear,
  },
];

export const deviceNavbarItems = [
  {
    to: "system",
    label: "System",
    icon: faInfo,
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
