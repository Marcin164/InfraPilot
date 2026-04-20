import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faDesktop,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import { twMerge } from "tailwind-merge";
import { getTicket } from "../../../Services/tickets";
import { useTicketSocket } from "../../../Hooks/useTicketSocket";
import type { Approval, Comment } from "../../../Types";
import CardHeader from "../../../Components/Headers/CardHeader";
import MessagesPanel from "../../Main/Helpdesk/components/MessagesPanel";
import MessageInput from "../../Main/Helpdesk/components/MessageInput";

const stateColor: Record<string, string> = {
  New: "bg-[#2B9AE9] text-white",
  Assigned: "bg-[#2B9AE9] text-white",
  "In progress": "bg-[#F1C40F] text-[#3C3C3C]",
  "Awaiting for user": "bg-[#F3606E] text-white",
  "Awaiting for vendor": "bg-[#8A8A8A] text-white",
  Resolved: "bg-[#30A712] text-white",
  Closed: "bg-[#535353] text-white",
  Cancelled: "bg-[#BC0E0E] text-white",
};

const Row = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-[6px] text-[14px]">
    <span className="text-[#8A8A8A]">{label}</span>
    <span className="font-semibold text-[#3C3C3C]">{value}</span>
  </div>
);

const convertApprovalsToComments = (approvals: Approval[]) =>
  approvals.map((a) => ({
    id: a.id,
    type: "decision",
    createdAt: a.createdAt,
    decidedAt: a.decidedAt,
    author: a.approver.distinguishedName,
    decision: a.decision,
  }));

const convertActivitiesToEntries = (activities: any[]) =>
  activities.map((a) => ({
    id: a.id,
    type: "activity",
    field: a.field,
    oldValue: a.oldValue,
    newValue: a.newValue,
    user: a.user,
    createdAt: a.createdAt,
  }));

const TicketDetails = () => {
  const params = useParams();

  const ticketQuery = useQuery({
    queryKey: ["ticket", params.id],
    queryFn: () => getTicket(params.id!),
  });

  const ticket = ticketQuery.data;

  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (ticket?.comments) setComments(ticket.comments);
  }, [ticket?.comments]);

  useEffect(() => {
    const activities = (ticket as any)?.activities;
    if (activities) setActivities(activities);
  }, [ticket]);

  useTicketSocket({
    ticketId: params.id!,
    onNewComment: (comment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    },
    onNewActivity: (activity) => {
      setActivities((prev) => {
        if (prev.some((a) => a.id === activity.id)) return prev;
        return [...prev, activity];
      });
    },
  });

  if (!ticket) return <div className="p-6 text-[#535353]">Loading…</div>;

  const allComments = [
    ...comments,
    ...convertApprovalsToComments(ticket.approvals || []),
    ...convertActivitiesToEntries(activities),
  ];

  return (
    <div className="flex h-[calc(100vh-58px)]">
      {/* Info panel — read-only */}
      <div className="my-4 ml-4 h-fit w-[420px] shrink-0 rounded-[10px] bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <CardHeader text={`${ticket.type} ${ticket.number}`} />
          <span
            className={twMerge(
              "rounded-full px-3 py-[3px] text-[11px] font-bold uppercase",
              stateColor[ticket.state] ?? "bg-[#E0E0E0] text-[#3C3C3C]",
            )}
          >
            {ticket.state}
          </span>
        </div>

        <Link
          to="/user/tickets"
          className="mt-1 inline-flex items-center gap-1 text-[12px] text-[#2B9AE9] hover:underline"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to tickets
        </Link>

        <div className="py-2">
          <div className="py-1">
            <FontAwesomeIcon icon={faUser} className="w-[20px]" />
            <span className="ml-2 font-semibold">
              {ticket.requester?.distinguishedName ?? "—"}
            </span>
          </div>
          <div className="py-1">
            <FontAwesomeIcon icon={faDesktop} className="w-[20px]" />
            <span className="ml-2 font-semibold">
              {ticket.device
                ? ticket.device.assetName || ticket.device.serialNumber
                : "N/A"}
            </span>
          </div>
          <div className="py-1">
            <FontAwesomeIcon icon={faClock} className="w-[20px]" />
            <span className="ml-2 font-semibold">
              {moment(ticket.createdAt).format("MM/DD/YYYY, HH:mm")}
            </span>
          </div>
        </div>

        <div className="mt-2 border-t border-[#E8E8E8] pt-2">
          <Row label="Type" value={ticket.type} />
          <Row
            label="Category"
            value={(ticket as any).category ?? "—"}
          />
          <Row label="Priority" value={ticket.priority} />
          <Row label="Impact" value={ticket.impact} />
          <Row label="Urgency" value={ticket.urgency} />
          <Row
            label="Assignment group"
            value={ticket.assignmentGroup || "—"}
          />
          <Row label="Assignee" value={ticket.assignee || "—"} />
        </div>
      </div>

      {/* Content panel — messages */}
      <div className="mx-4 my-4 flex h-[calc(100vh-90px)] w-full flex-col">
        <div className="shrink-0 rounded-[10px] bg-white p-4 shadow-xl">
          <div className="text-[14px] font-light">Description</div>
          <div className="font-bold">{ticket.description}</div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          <MessagesPanel comments={allComments} />
        </div>

        <div className="shrink-0">
          <MessageInput
            ticketId={ticket.id}
            onOptimisticComment={(c: any) =>
              setComments((prev) => [...prev, c])
            }
          />
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
