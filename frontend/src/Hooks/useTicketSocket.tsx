import { useEffect, useRef } from "react";
import { socket } from "../lib/socket";

export const useTicketSocket = ({
  ticketId,
  onNewComment,
}: {
  ticketId?: string;
  onNewComment?: (comment: any) => void;
}) => {
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!ticketId) return;

    if (!socket.connected) {
      socket.connect();
    }

    if (!joinedRef.current) {
      socket.emit("ticket.join", ticketId);
      joinedRef.current = true;
    }

    if (onNewComment) {
      socket.on("ticket.comment.created", onNewComment);
    }

    return () => {
      if (joinedRef.current) {
        socket.emit("ticket.leave", ticketId);
        joinedRef.current = false;
      }

      if (onNewComment) {
        socket.off("ticket.comment.created", onNewComment);
      }
    };
  }, [ticketId]);
};
