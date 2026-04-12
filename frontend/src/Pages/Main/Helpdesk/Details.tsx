import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getTicket } from "../../../Services/tickets";
import type { Comment, Approval } from "../../../Types";
import { useTicketSocket } from "../../../Hooks/useTicketSocket";
import { useParser } from "../../../Hooks/useParser";
import TicketInfoPanel from "./components/TicketInfoPanel";
import TicketContentPanel from "./components/TicketContentPanel";
import TicketSidePanel from "./components/TicketSidePanel";

const convertApprovalsToComments = (approvals: Approval[]) => {
  return approvals.map((approval) => ({
    id: approval.id,
    type: "decision",
    createdAt: approval.createdAt,
    decidedAt: approval.decidedAt,
    author: approval.approver.distinguishedName,
    decision: approval.decision,
  }));
};

const convertActivitiesToEntries = (activities: any[]) => {
  return activities.map((activity) => ({
    id: activity.id,
    type: "activity",
    field: activity.field,
    oldValue: activity.oldValue,
    newValue: activity.newValue,
    user: activity.user,
    createdAt: activity.createdAt,
  }));
};

const Details = () => {
  const params = useParams();
  const { setParsers } = useParser();
  const ticketQuery = useQuery({
    queryKey: ["ticket", params.id],
    queryFn: () => getTicket(params.id!),
  });

  const ticket = ticketQuery.data;

  useEffect(() => {
    if (ticket?.id) {
      setParsers({
        [ticket.id]:
          ticket.requester?.distinguishedName ?? ticket.number?.toString() ?? ticket.id,
      });
    }
    return () => setParsers({});
  }, [ticket?.id, setParsers]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (ticket?.comments) {
      setComments(ticket.comments);
    }
  }, [ticket?.comments]);

  useEffect(() => {
    if (ticket?.activities) {
      setActivities(ticket.activities);
    }
  }, [ticket?.activities]);

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

  const allComments = [
    ...comments,
    ...convertApprovalsToComments(ticket?.approvals || []),
    ...convertActivitiesToEntries(activities),
  ];

  if (!ticket) return null;

  return (
    <div className="flex h-[calc(100vh-58px)]">
      <TicketInfoPanel ticket={ticket} />

      <TicketContentPanel
        ticketId={ticket.id}
        description={ticket.description}
        allComments={allComments}
        onOptimisticComment={(comment: any) =>
          setComments((prev) => [...prev, comment])
        }
      />

      <TicketSidePanel
        closureCode={ticket.closureCode}
        closureNotes={ticket.closureNotes}
        requesterId={ticket.requester.id}
        approvals={ticket.approvals}
      />
    </div>
  );
};

export default Details;
