import React, { useState } from "react";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import EventsTable from "../../../../Components/Tables/EventsTable";
import { useOutletContext } from "react-router";

type Props = {};

const Events = (props: Props) => {
  const device: any = useOutletContext();

  if (!device.data.eventLogs) return null;
  const eventLogs = device.data.eventLogs;
  const [eventType, setEventType] = useState(eventLogs.System);

  const toggleEventType = (type: string) => {
    setEventType(() => eventLogs[type]);
  };

  return (
    <div>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <ButtonPrimary
          text="System"
          onClick={() => toggleEventType("System")}
        />
        <ButtonPrimary
          text="Application"
          onClick={() => toggleEventType("Application")}
        />
        <ButtonPrimary
          text="Security"
          onClick={() => toggleEventType("Security")}
        />
      </div>
      <EventsTable data={eventType} />
    </div>
  );
};

export default Events;
