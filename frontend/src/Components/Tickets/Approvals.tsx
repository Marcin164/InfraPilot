import React, { useState } from "react";
import CardHeader from "../Headers/CardHeader";
import SelectSecondary from "../Inputs/SelectSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { findApprovers } from "../../Services/users";
import { toast } from "react-toastify";
import { createApproval } from "../../Services/tickets";
import { useParams } from "react-router-dom";
import moment from "moment";
import { twMerge } from "tailwind-merge";

type Props = {
  requesterId: string;
  approvals: any[];
};

const Approvals = ({ requesterId, approvals }: Props) => {
  const queryClient = useQueryClient();
  const params = useParams();
  const [approverId, setApproverId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      return createApproval(
        params.id!,
        values.requesterId,
        values.approverId,
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", params.id] });
      toast.success("Ticket updated!");
    },
  });

  const approversQuery = useQuery({
    queryKey: ["approvers"],
    queryFn: () => findApprovers(),
  });

  const createApproversOptions = () => {
    return approversQuery.data?.map((approver: any) => ({
      label: approver.distinguishedName,
      value: approver.id,
    }));
  };

  const handleApproverSelect = (e: any) => {
    setApproverId(e.value);
  };

  const addApproval = () => {
    mutation.mutate({ requesterId: requesterId, approverId: approverId });
  };

  const parseDecision = (decision: string) => {
    switch (decision) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div>
      <CardHeader text="Approvals" />
      <SelectSecondary
        label="Approver"
        onSelect={handleApproverSelect}
        options={createApproversOptions()}
      />
      <ButtonPrimary
        text="Send approval"
        className="mt-4"
        onClick={addApproval}
      />
      <div className="mt-4">
        {approvals.map((approval) => (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div
                className={twMerge(
                  "w-[10px] h-[10px] rounded-full",
                  parseDecision(approval?.decision),
                )}
              ></div>
              <div className="font-semibold">
                {approval?.approver?.distinguishedName}
              </div>
            </div>
            <div className="text-[12px]">
              {moment(approval?.decidedAt || approval?.createdAt).format(
                "DD/MM/YYYY, HH:mm",
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Approvals;
