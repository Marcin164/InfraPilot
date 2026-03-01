import React from "react";
import DataTable from "react-data-table-component";

type Props = { columns: any; data: any; onRowClicked?: any };

const HeadlessTable = ({ columns, data, onRowClicked }: Props) => {
  return (
    <DataTable
      columns={columns}
      data={data}
      noHeader
      noTableHead
      onRowClicked={onRowClicked}
    />
  );
};

export default HeadlessTable;
