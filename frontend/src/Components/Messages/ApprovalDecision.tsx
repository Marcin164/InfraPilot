import React from "react";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import {
  faCheckCircle,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";

type Props = {};

const ApprovalDecision = (props: Props) => {
  return (
    <div className="w-[50%] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 ml-[25%] my-4 border-2 border-[#535353]">
      <div className="text-[14px] font-light">
        Marcin Nowakowski is requesting your approval
      </div>
      <div className="">Please approve replacing user's computer</div>
      <div className="pt-2">
        <ButtonPrimary
          text="Approve"
          icon={faCheckCircle}
          className="bg-[#30A712] hover:bg-[#108500]"
        />
        <ButtonPrimary
          text="Reject"
          icon={faXmarkCircle}
          className="bg-[#F3606E] hover:bg-[#D1404C] ml-2"
        />
      </div>
    </div>
  );
};

export default ApprovalDecision;
