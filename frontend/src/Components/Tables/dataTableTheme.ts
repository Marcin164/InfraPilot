import { createTheme } from "react-data-table-component";

createTheme(
  "appDark",
  {
    text: {
      primary: "#E5E7EB",
      secondary: "#9AA3AE",
      disabled: "#5A6270",
    },
    background: {
      default: "#1A1F26",
    },
    context: {
      background: "#172F45",
      text: "#E5E7EB",
    },
    divider: {
      default: "#2A2F38",
    },
    button: {
      default: "#9AA3AE",
      focus: "#E5E7EB",
      hover: "#E5E7EB",
      disabled: "#3A404B",
    },
    selected: {
      default: "#172F45",
      text: "#E5E7EB",
    },
    highlightOnHover: {
      default: "#1D323F",
      text: "#E5E7EB",
    },
    striped: {
      default: "#161A1D",
      text: "#E5E7EB",
    },
  },
  "dark",
);

export const DATA_TABLE_DARK_THEME = "appDark";
