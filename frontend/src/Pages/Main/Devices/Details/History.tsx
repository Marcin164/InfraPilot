import React, { useState } from "react";
import TimelineLine from "../../../../Components/Timeline/TimelineLine";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { faArrowsRotate, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import AssignDeviceModal from "../../../../Components/Modals/AssignDeviceModal";
import { useQuery } from "@tanstack/react-query";
import { getDeviceOwners } from "../../../../Services/histories";
import { useAuthInfo } from "@propelauth/react";
import { useParams } from "react-router";

type Props = {};

const History = (props: Props) => {
  const authInfo = useAuthInfo();
  const params = useParams();
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const historyQuery = useQuery({
    queryKey: ["ownersHistory"],
    queryFn: () => getDeviceOwners(authInfo.accessToken, params.id),
  });

  if (!historyQuery?.data) return null;

  const convertToTimeline = () => {
    return historyQuery.data.map((history: any) => {
      return {
        ...history,
        owner: history?.user?.distinguishedName,
      };
    });
  };

  const toggleAssignUserModal = () => {
    setIsAssignUserModalOpen((prev) => !prev);
  };

  return (
    <div className="flex justify-between">
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 mr-1">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">Owners</div>
        <TimelineLine items={convertToTimeline()} />
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
        <TimelineLine items={[]} />
        <div className="pt-4">
          <ButtonPrimary icon={faMicrochip} text="Apply Changes" />
        </div>
      </div>
    </div>
  );
};

export default History;
