import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getTicket } from "../../../Services/tickets";
import type { Comment, Approval } from "../../../Types";
import { useTicketSocket } from "../../../Hooks/useTicketSocket";
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

const Details = () => {
  const params = useParams();
  const ticketQuery = useQuery({
    queryKey: ["ticket", params.id],
    queryFn: () => getTicket(params.id!),
  });

  const ticket = ticketQuery.data;

  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (ticket?.comments) {
      setComments(ticket.comments);
    }
  }, [ticket?.comments]);

  useTicketSocket({
    ticketId: params.id!,
    onNewComment: (comment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    },
  });

  const allComments = [
    ...comments,
    ...convertApprovalsToComments(ticket?.approvals || []),
  ];

  if (!ticket) return null;

  return (
    <div className="flex h-full">
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
