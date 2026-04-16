import React, { useState } from "react";
import Modal from "./AnimatedModal";
import CardHeader from "../Headers/CardHeader";
import EditCalendarForm from "../Forms/EditCalendarForm";
import EditHolidaysForm from "../Forms/EditHolidaysForm";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = {
  data: any;
  isModalOpen: boolean;
  handleOnClose: any;
};

const EditCalendarModal = ({ data, isModalOpen, handleOnClose }: Props) => {
  const [selectedTab, setSelectedTab] = useState("calendar");

  const handleTabSelection = (tab: string) => {
    setSelectedTab(tab);
  };

  return (
    <Modal
      classNames={{
        modal: "w-[500px] h-[600px] rounded-[10px]",
      }}
      open={isModalOpen}
      onClose={handleOnClose}
      center
    >
      <CardHeader text={data ? "Edit calendar" : "Add calendar"} />
      <div className="flex space-x-2 my-4">
        <ButtonPrimary
          text="Calendar"
          onClick={() => handleTabSelection("calendar")}
        />
        <ButtonPrimary
          text="Holidays"
          onClick={() => handleTabSelection("holidays")}
        />
      </div>
      {selectedTab === "calendar" && <EditCalendarForm data={data} />}
      {selectedTab === "holidays" && (
        <EditHolidaysForm calendarId={data?.id} holidayDates={data?.holidays} />
      )}
    </Modal>
  );
};

export default EditCalendarModal;
