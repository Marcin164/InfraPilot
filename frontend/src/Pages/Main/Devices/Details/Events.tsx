import React, { useState } from "react";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import EventsTable from "../../../../Components/Tables/EventsTable";
import { useOutletContext } from "react-router";

type Props = {};

const Events = (props: Props) => {
  const device: any = useOutletContext();

  if (!device.data.eventLogs) return null;
  const eventLogs = device.data.eventLogs;
  const [eventType, setEventType] = useState(eventLogs.system);

  const toggleEventType = (type: string) => {
    setEventType(() => eventLogs[type]);
  };

  return (
    <div>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <ButtonPrimary
          text="System"
          onClick={() => toggleEventType("system")}
        />
        <ButtonPrimary
          text="Application"
          onClick={() => toggleEventType("application")}
        />
        <ButtonPrimary
          text="Security"
          onClick={() => toggleEventType("security")}
        />
      </div>
      <EventsTable data={eventType} />
    </div>
  );
};

export default Events;
