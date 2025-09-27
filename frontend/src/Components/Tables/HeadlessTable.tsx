import React from "react";
import DataTable from "react-data-table-component";

type Props = { columns: any; data: any };

const HeadlessTable = ({ columns, data }: Props) => {
  return <DataTable columns={columns} data={data} noHeader noTableHead />;
};

export default HeadlessTable;
