import React from "react";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import {
  faCheckCircle,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApproval } from "../../Services/tickets";
import { twMerge } from "tailwind-merge";
import moment from "moment";
import { useParams } from "react-router-dom";

type Props = {
  id: string;
  author: string;
  decision?: "approved" | "rejected";
  createdAt: any;
  decidedAt?: any;
};

const ApprovalDecision = ({
  id,
  author,
  decision,
  createdAt,
  decidedAt,
}: Props) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      return updateApproval(id, { decision: values.decision });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", params.id] });
    },
  });

  const handleDecision = (decision: "approved" | "rejected") => {
    mutation.mutate({ decision: decision });
  };

  return (
    <div
      className={twMerge(
        "w-[50%] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 ml-[25%] my-4 border-2 border-[#535353]",
        decision === "approved" ? "border-[#30A712]" : "border-[#F3606E]",
      )}
    >
      <div className="text-[14px] font-light">
        {!decision ? (
          `${author} is requesting your approval`
        ) : (
          <>
            {author} has{" "}
            <span
              className={twMerge(
                "font-bold uppercase",
                decision === "approved" ? "text-[#30A712]" : "text-[#F3606E]",
              )}
            >
              {decision}
            </span>{" "}
            your request
          </>
        )}
      </div>
      <div className="font-bold">Please approve replacing user's computer</div>
      {!decision && (
        <div className="pt-2">
          <ButtonPrimary
            text="Approve"
            icon={faCheckCircle}
            className="bg-[#30A712] hover:bg-[#108500]"
            onClick={() => handleDecision("approved")}
          />
          <ButtonPrimary
            text="Reject"
            icon={faXmarkCircle}
            className="bg-[#F3606E] hover:bg-[#D1404C] ml-2"
            onClick={() => handleDecision("rejected")}
          />
        </div>
      )}
      <div className="text-[12px] font-light">
        Requested: {moment(createdAt).format("DD/MM/YYYY, HH:mm")}
      </div>
      {decidedAt && (
        <div className="text-[12px] font-light">
          Decided: {moment(decidedAt).format("DD/MM/YYYY, HH:mm")}
        </div>
      )}
    </div>
  );
};

export default ApprovalDecision;
