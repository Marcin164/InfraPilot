import React from "react";
import DataTable from "react-data-table-component";
import { useTheme } from "../../Context/ThemeContext";
import { DATA_TABLE_DARK_THEME } from "./dataTableTheme";

type Props = { columns: any; data: any; onRowClicked?: any };

const HeadlessTable = ({ columns, data, onRowClicked }: Props) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const customStyles = {
    rows: {
      style: {
        backgroundColor: isDark ? "#1A1F26" : undefined,
        color: isDark ? "#E5E7EB" : undefined,
        borderBottomColor: isDark ? "#2A2F38" : "#eeeeee",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: isDark ? "#1D323F" : "#d2ecff",
        },
      },
    },
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      noHeader
      noTableHead
      onRowClicked={onRowClicked}
      customStyles={customStyles}
      theme={isDark ? DATA_TABLE_DARK_THEME : "default"}
    />
  );
};

export default HeadlessTable;
