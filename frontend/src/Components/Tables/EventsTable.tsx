import React from "react";
import MainTable from "./MainTable";

type Props = { data: any };

const EventsTable = ({ data }: Props) => {
  if (!data) return null;

  const parseEventType = (type: any) => {
    const typeObject = { text: "N/A", background: "#3C3C3C" };

    switch (type) {
      case 1:
        typeObject.text = "Error";
        typeObject.background = "#BC0E0E";
        break;

      case 2:
        typeObject.text = "Warning";
        typeObject.background = "#AFBA17";
        break;

      case 4:
        typeObject.text = "Information";
        typeObject.background = "#2B9AE9";
        break;

      case 8:
        typeObject.text = "Success Audit";
        typeObject.background = "#30A712";
        break;

      case 16:
        typeObject.text = "Failure Audit";
        typeObject.background = "#F3606E";
        break;

      default:
        typeObject.text = "N/A";
        typeObject.background = "#3C3C3C";
        break;
    }

    return typeObject;
  };

  const columns = [
    {
      name: "Id",
      selector: (row: any) => row.EventID,
      width: "100px",
    },
    {
      name: "Category",
      selector: (row: any) => row.Category,
      width: "100px",
    },
    {
      name: "Type",
      cell: (row: any) => (
        <div
          style={{ background: parseEventType(row?.EventType).background }}
          className="w-[100px] px-1 py-2 rounded-[10px] text-center text-[#FFFFFF]"
        >
          {parseEventType(row?.EventType).text}
        </div>
      ),
      width: "150px",
    },
    {
      name: "Source",
      selector: (row: any) => row.SourceName,
      width: "200px",
    },
    {
      name: "Message",
      selector: (row: any) =>
        row?.Strings && row?.Strings?.length > 0 ? row.Strings[0] : "N/A",
      width: "400px",
    },
    {
      name: "Occurred",
      selector: (row: any) => row.TimeGenerated,
    },
  ];
  return <MainTable columns={columns} data={data} />;
};

export default EventsTable;
