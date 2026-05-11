import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import EventsTable from "../../../../Components/Tables/EventsTable";
import { useOutletContext } from "react-router";
import NoData from "../components/NoData";

type Props = {};

const Events = (props: Props) => {
  const { t } = useTranslation();
  const device: any = useOutletContext();

  if (!device.data.eventLogs) return <NoData />;

  const eventLogs = device.data.eventLogs;
  const [eventType, setEventType] = useState(eventLogs.System);

  const toggleEventType = (type: string) => {
    setEventType(() => eventLogs[type]);
  };

  return (
    <div>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
        <ButtonPrimary
          text={t("device.section.eventsSystem")}
          onClick={() => toggleEventType("System")}
        />
        <ButtonPrimary
          text={t("device.section.eventsApplication")}
          onClick={() => toggleEventType("Application")}
        />
        <ButtonPrimary
          text={t("device.section.eventsSecurity")}
          onClick={() => toggleEventType("Security")}
        />
      </div>
      <EventsTable data={eventType} />
    </div>
  );
};

export default Events;
