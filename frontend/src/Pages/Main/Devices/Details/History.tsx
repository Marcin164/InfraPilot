import React, { useState } from "react";
import TimelineLine from "../../../../Components/Timeline/TimelineLine";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { faArrowsRotate, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import AssignDeviceModal from "../../../../Components/Modals/AssignDeviceModal";
import { useQuery } from "@tanstack/react-query";
import { getDeviceOwners } from "../../../../Services/histories";
import { useAuthInfo } from "@propelauth/react";
import { useParams } from "react-router";
import ApplyChangesModal from "../../../../Components/Modals/ApplyChangesModal";

type Props = {};

const History = (props: Props) => {
  const authInfo = useAuthInfo();
  const params = useParams();
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [isApplyChangesModalOpen, setIsApplyChangesModalOpen] = useState(false);
  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: () => getDeviceOwners(authInfo.accessToken, params.id),
  });

  if (!historyQuery?.data) return null;

  const getChangesHistory = () => {
    return historyQuery.data.filter((history: any) => history.type !== 0);
  };

  const convertToTimeline = () => {
    const historyOwners = historyQuery?.data?.filter(
      (history: any) => history.type == 0
    );
    return historyOwners.map((history: any) => {
      return {
        ...history,
        owner: history?.user?.distinguishedName,
      };
    });
  };

  const toggleAssignUserModal = () => {
    setIsAssignUserModalOpen((prev) => !prev);
  };

  const toggleApplyChangesModal = () => {
    setIsApplyChangesModalOpen((prev) => !prev);
  };

  return (
    <div className="flex justify-between">
      <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 mr-1">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">Owners</div>
        {historyQuery.data.length > 0 ? (
          <TimelineLine items={convertToTimeline()} />
        ) : (
          <div>This device has no owners yet</div>
        )}
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
        <TimelineLine items={getChangesHistory()} />
        <div className="pt-4">
          <ButtonPrimary
            icon={faMicrochip}
            text="Apply Changes"
            onClick={toggleApplyChangesModal}
          />
          <ApplyChangesModal
            isModalOpen={isApplyChangesModalOpen}
            handleOnClose={toggleApplyChangesModal}
          />
        </div>
      </div>
    </div>
  );
};

export default History;
