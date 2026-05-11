import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { findApprovers } from "../../../../Services/users";
import { toast } from "react-toastify";
import { createApproval } from "../../../../Services/tickets";
import { useParams } from "react-router-dom";
import moment from "moment";
import { twMerge } from "tailwind-merge";

import type { Approval, User } from "../../../../Types";

type Props = {
  requesterId: string;
  approvals: Approval[];
};

const Approvals = ({ requesterId, approvals }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useParams();
  const [approverId, setApproverId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: { requesterId: string; approverId: string }) => {
      return createApproval(
        params.id!,
        values.requesterId,
        values.approverId,
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", params.id] });
      toast.success(t("toast.success.approvalSent"));
    },
    onError: () => {
      toast.error(t("toast.error.approvalSend"));
    },
  });

  const approversQuery = useQuery({
    queryKey: ["approvers"],
    queryFn: () => findApprovers(),
  });

  const createApproversOptions = () => {
    return approversQuery.data?.map((approver: User) => ({
      label: approver.distinguishedName,
      value: approver.id,
    }));
  };

  const handleApproverSelect = (e: any) => {
    setApproverId(e.value);
  };

  const addApproval = () => {
    if (!approverId) return;
    mutation.mutate({ requesterId, approverId });
  };

  const parseDecision = (decision: string | null) => {
    switch (decision) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const decisionLabel = (decision?: string | null) => {
    if (decision === "approved") return t("helpdesk.decision.approved");
    if (decision === "rejected") return t("helpdesk.decision.rejected");
    return t("helpdesk.decision.pending");
  };

  const hasPending = approvals.some((a) => !a.decision);

  return (
    <div>
      <CardHeader text={t("helpdesk.approvals")} />
      <SelectSecondary
        label={t("helpdesk.approver")}
        onSelect={handleApproverSelect}
        options={createApproversOptions() ?? []}
      />
      <ButtonPrimary
        text={hasPending ? t("helpdesk.approvalPending") : t("helpdesk.sendApproval")}
        className="mt-4"
        onClick={addApproval}
        disabled={hasPending || !approverId || mutation.isPending}
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
              <div className="text-[12px] uppercase font-bold ml-auto">
                {decisionLabel(approval?.decision)}
              </div>
            </div>
            <div className="text-[12px]">
              {approval?.decidedAt
                ? t("helpdesk.decided", { date: moment(approval.decidedAt).format("DD/MM/YYYY, HH:mm") })
                : t("helpdesk.requested", { date: moment(approval?.createdAt).format("DD/MM/YYYY, HH:mm") })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Approvals;
