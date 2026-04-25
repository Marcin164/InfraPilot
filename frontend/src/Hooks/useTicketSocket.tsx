import { useEffect, useRef } from "react";
import { socket } from "../lib/socket";

export type TicketViewer = { userId: string; label: string };

export const useTicketSocket = ({
  ticketId,
  userId,
  userLabel,
  onNewComment,
  onNewActivity,
  onViewers,
}: {
  ticketId?: string;
  userId?: string;
  userLabel?: string;
  onNewComment?: (comment: any) => void;
  onNewActivity?: (activity: any) => void;
  onViewers?: (viewers: TicketViewer[]) => void;
}) => {
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!ticketId) return;

    if (!socket.connected) {
      socket.connect();
    }

    if (!joinedRef.current) {
      socket.emit("ticket.join", {
        ticketId,
        userId: userId ?? "",
        label: userLabel ?? userId ?? "",
      });
      joinedRef.current = true;
    }

    if (onNewComment) {
      socket.on("ticket.comment.created", onNewComment);
    }

    if (onNewActivity) {
      socket.on("ticket.activity.created", onNewActivity);
    }

    if (onViewers) {
      socket.on("ticket.viewers", onViewers);
    }

    return () => {
      if (joinedRef.current) {
        socket.emit("ticket.leave", { ticketId });
        joinedRef.current = false;
      }

      if (onNewComment) {
        socket.off("ticket.comment.created", onNewComment);
      }

      if (onNewActivity) {
        socket.off("ticket.activity.created", onNewActivity);
      }

      if (onViewers) {
        socket.off("ticket.viewers", onViewers);
      }
    };
  }, [ticketId, userId]);
};
