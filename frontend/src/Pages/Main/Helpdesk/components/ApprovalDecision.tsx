import React from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import {
  faCheckCircle,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApproval } from "../../../../Services/tickets";
import { twMerge } from "tailwind-merge";
import moment from "moment";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

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
  const { t } = useTranslation();
  const params = useParams();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      return updateApproval(id, { decision: values.decision });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", params.id] });
      toast.success(t("toast.success.approvalSaved"));
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        t("helpdesk.onlyAssignedApprover");
      toast.error(message);
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
          t("helpdesk.requestingApproval", { author })
        ) : (
          t("helpdesk.hasDecided", {
            author,
            decision:
              decision === "approved"
                ? t("helpdesk.decision.approved")
                : t("helpdesk.decision.rejected"),
          })
        )}
      </div>
      <div className="font-bold">{t("helpdesk.approveReplacement")}</div>
      {!decision && (
        <div className="pt-2">
          <ButtonPrimary
            text={t("helpdesk.approve")}
            icon={faCheckCircle}
            className="bg-[#30A712] hover:bg-[#108500]"
            onClick={() => handleDecision("approved")}
          />
          <ButtonPrimary
            text={t("helpdesk.reject")}
            icon={faXmarkCircle}
            className="bg-[#F3606E] hover:bg-[#D1404C] ml-2"
            onClick={() => handleDecision("rejected")}
          />
        </div>
      )}
      <div className="text-[12px] font-light">
        {t("helpdesk.requested", { date: moment(createdAt).format("DD/MM/YYYY, HH:mm") })}
      </div>
      {decidedAt && (
        <div className="text-[12px] font-light">
          {t("helpdesk.decided", { date: moment(decidedAt).format("DD/MM/YYYY, HH:mm") })}
        </div>
      )}
    </div>
  );
};

export default ApprovalDecision;
