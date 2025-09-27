import React from "react";
import TimelineLine from "../../../../Components/Timeline/TimelineLine";

type Props = {};

const History = (props: Props) => {
  const items = [
    {
      date: "08.10.2025",
      ticket: "SR6667777",
      details: "Added 16 GB RAM",
    },
    {
      date: "08.10.2025",
      ticket: "SR6667777",
      details: "lorem ipsum",
    },
  ];

  const items2 = [
    {
      date: "08.10.2025",
      ticket: "SR6667777",
      owner: "Marcin Nowakowski",
    },
    {
      date: "08.10.2025",
      ticket: "SR6667777",
      owner: "Jan Kowalski",
    },
  ];

  return (
    <div className="flex justify-between">
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 mr-1">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">Owners</div>
        <TimelineLine items={items2} />
      </div>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 ml-1">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">Changes</div>
        <TimelineLine items={items} />
      </div>
    </div>
  );
};

export default History;
