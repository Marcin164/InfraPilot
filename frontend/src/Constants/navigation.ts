import {
  faChartPie,
  faComputer,
  faGear,
  faRobot,
  faUsers,
  faWarehouse,
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
    to: "/flows",
    label: "Flows",
    icon: faRobot,
  },
  {
    to: "/storage",
    label: "Storage",
    icon: faWarehouse,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: faGear,
  },
];
