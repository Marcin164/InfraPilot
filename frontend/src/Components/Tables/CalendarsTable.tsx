import React from "react";
import HeadlessTable from "./HeadlessTable";
import { parseWorkdays } from "../../Helpers/forms";

type Props = {
  data: any[];
  onEdit: any;
};

const CalendarsTable = ({ data, onEdit }: Props) => {
  const columns = [
    {
      selector: (row: any) => row.name,
      width: "40%",
    },
    {
      selector: (row: any) =>
        parseWorkdays(row?.workingDays).map((day: any) => (
          <span
            className="px-2 mx-1 bg-[#30A712] rounded-xl text-white"
            key={day}
          >
            {day}
          </span>
        )),
    },
  ];
  return (
    <HeadlessTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => onEdit(row)}
    />
  );
};

export default CalendarsTable;
