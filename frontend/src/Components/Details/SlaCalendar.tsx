import CardHeader from "../Headers/CardHeader";
import CalendarsTable from "../Tables/CalendarsTable";
import EditCalendarModal from "../Modals/EditCalendarModal";
import { useState } from "react";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

type Props = {
  slaCalendars: any;
};

const SlaCalendar = ({ slaCalendars }: Props) => {
  if (!slaCalendars) return null;

  const [isEditCalendarModalOpen, setIsEditCalendarModalOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);

  const openAddCalendarModal = () => {
    setSelectedCalendar(null);
    setIsEditCalendarModalOpen(true);
  };

  const openEditCalendarModal = (row: any) => {
    setSelectedCalendar(row);
    setIsEditCalendarModalOpen(true);
  };

  const closeCalendarModal = () => {
    setIsEditCalendarModalOpen(false);
    setSelectedCalendar(null);
  };

  return (
    <div className="w-full h-[300px] overflow-y-auto bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <CardHeader text="Calendars" />
        <ButtonPrimary
          icon={faPlus}
          text="Add calendar"
          onClick={openAddCalendarModal}
        />
      </div>
      <CalendarsTable data={slaCalendars} onEdit={openEditCalendarModal} />
      <EditCalendarModal
        data={selectedCalendar}
        isModalOpen={isEditCalendarModalOpen}
        handleOnClose={closeCalendarModal}
      />
    </div>
  );
};

export default SlaCalendar;
