import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import moment from "moment";
import { toast } from "react-toastify";
import { getMyApprovals, updateApproval } from "../../../Services/tickets";
import type { MyApproval } from "../../../Types";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import PageMotion from "../../../Components/PageMotion/PageMotion";

const priorityColor: Record<string, string> = {
  Low: "text-[#30A712]",
  Medium: "text-[#2B9AE9]",
  High: "text-[#F1C40F]",
  Critical: "text-[#BC0E0E]",
};

const ApprovalRow = ({ approval }: { approval: MyApproval }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      updateApproval(approval.id, { decision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      toast.success("Decision saved");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to save decision");
    },
  });

  const requesterName =
    [approval.ticket.requester?.name, approval.ticket.requester?.surname]
      .filter(Boolean)
      .join(" ") ||
    approval.ticket.requester?.email ||
    "Unknown requester";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-white p-4 shadow-xl transition hover:shadow-2xl">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 text-[14px] font-bold text-[#3C3C3C]">
          {approval.ticket.type} {approval.ticket.number}
        </span>
        <span
          className={twMerge(
            "shrink-0 text-[13px] font-semibold",
            priorityColor[approval.ticket.priority] ?? "",
          )}
        >
          {approval.ticket.priority}
        </span>
        <span className="truncate text-[13px] text-[#535353]">
          {approval.ticket.title}
        </span>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <span className="text-[12px] text-[#8A8A8A]">
          Requested by {requesterName} ·{" "}
          {moment(approval.createdAt).format("DD MMM YYYY")}
        </span>
        <Link
          to={`/user/tickets/${approval.ticket.id}`}
          className="text-[13px] font-semibold text-[#2B9AE9] hover:underline"
        >
          View details
        </Link>
        <ButtonPrimary
          text="Approve"
          icon={faCheckCircle}
          className="bg-[#30A712] hover:bg-[#108500]"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("approved")}
        />
        <ButtonPrimary
          text="Reject"
          icon={faXmarkCircle}
          className="bg-[#F3606E] hover:bg-[#D1404C]"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("rejected")}
        />
      </div>
    </div>
  );
};

const Approvals = () => {
  const query = useQuery({
    queryKey: ["my-approvals"],
    queryFn: getMyApprovals,
  });

  const approvals = query.data ?? [];

  return (
    <PageMotion>
      <div className="space-y-4 p-4">
        <h2 className="pb-2 text-[18px] font-bold text-[#3C3C3C]">
          Pending approvals{" "}
          <span className="text-[14px] font-semibold text-[#8A8A8A]">
            ({approvals.length})
          </span>
        </h2>

        {query.isLoading && (
          <div className="rounded-[10px] bg-white p-4 text-[#8A8A8A] shadow-xl">
            Loading…
          </div>
        )}
        {!query.isLoading && approvals.length === 0 && (
          <div className="rounded-[10px] bg-white p-4 text-[#8A8A8A] shadow-xl">
            You have no pending approvals.
          </div>
        )}
        {!query.isLoading && approvals.length > 0 && (
          <div className="flex flex-col gap-2">
            {approvals.map((approval) => (
              <ApprovalRow key={approval.id} approval={approval} />
            ))}
          </div>
        )}
      </div>
    </PageMotion>
  );
};

export default Approvals;
