import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuthInfo } from "@propelauth/react";
import { getTicket } from "../../../Services/tickets";
import type { Comment, Approval } from "../../../Types";
import {
  useTicketSocket,
  type TicketViewer,
} from "../../../Hooks/useTicketSocket";
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
  const { t } = useTranslation();
  const params = useParams();
  const { setParsers } = useParser();
  const { user }: any = useAuthInfo();
  const myId = user?.metadata?.id ?? user?.userId ?? "";
  const myLabel =
    [user?.metadata?.firstName, user?.metadata?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    myId;

  const [infoOpen, setInfoOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const openInfo = () => { setInfoOpen(true); setSideOpen(false); };
  const openSide = () => { setSideOpen(true); setInfoOpen(false); };

  const ticketQuery = useQuery({
    queryKey: ["ticket", params.id],
    queryFn: () => getTicket(params.id!),
  });

  const ticket: any = ticketQuery.data;
  const [viewers, setViewers] = useState<TicketViewer[]>([]);

  useEffect(() => {
    if (ticket?.id) {
      setParsers({
        [ticket.id]:
          ticket.requester?.distinguishedName ??
          ticket.number?.toString() ??
          ticket.id,
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
    userId: myId,
    userLabel: myLabel,
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
    onViewers: setViewers,
  });

  const allComments = [
    ...comments,
    ...convertApprovalsToComments(ticket?.approvals || []),
    ...convertActivitiesToEntries(activities),
  ];

  if (!ticket) return null;

  const otherViewers = viewers.filter((v) => v.userId !== myId);

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-58px)] relative">
      {otherViewers.length > 0 && (
        <div className="absolute top-2 right-2 z-30 rounded-full bg-[#3C3C3C] text-white px-3 py-1 text-[11px] font-bold shadow">
          👁 {t("helpdesk.alsoViewing", { users: otherViewers.map((v) => v.label).join(", ") })}
        </div>
      )}

      {(infoOpen || sideOpen) && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => { setInfoOpen(false); setSideOpen(false); }}
        />
      )}

      <TicketInfoPanel ticket={ticket} isOpen={infoOpen} onClose={() => setInfoOpen(false)} />

      <TicketContentPanel
        ticketId={ticket.id}
        description={ticket.description}
        allComments={allComments}
        onOptimisticComment={(comment: any) =>
          setComments((prev) => [...prev, comment])
        }
        onInfoToggle={openInfo}
        onSideToggle={openSide}
      />

      <TicketSidePanel
        closureCode={ticket.closureCode}
        closureNotes={ticket.closureNotes}
        requesterId={ticket.requester.id}
        approvals={ticket.approvals}
        isOpen={sideOpen}
        onClose={() => setSideOpen(false)}
      />
    </div>
  );
};

export default Details;
