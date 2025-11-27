import React, { useState } from "react";
import TimelineLine from "../../../../Components/Timeline/TimelineLine";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { faArrowsRotate, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import AssignDeviceModal from "../../../../Components/Modals/AssignDeviceModal";

type Props = {};

const History = (props: Props) => {
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
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

  const toggleAssignUserModal = () => {
    setIsAssignUserModalOpen((prev) => !prev);
  };

  return (
    <div className="flex justify-between">
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 mr-1">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">Owners</div>
        <TimelineLine items={items2} />
        <div className="pt-4">
          <ButtonPrimary
            icon={faArrowsRotate}
            text="Assign device"
            onClick={toggleAssignUserModal}
          />
          <AssignDeviceModal
            isModalOpen={isAssignUserModalOpen}
            handleOnClose={toggleAssignUserModal}
          />
        </div>
      </div>
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 ml-1">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">Changes</div>
        <TimelineLine items={items} />
        <div className="pt-4">
          <ButtonPrimary icon={faMicrochip} text="Apply Changes" />
        </div>
      </div>
    </div>
  );
};

export default History;
