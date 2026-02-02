import React, { useEffect, useState } from "react";
import CardHeader from "../../../Components/Headers/CardHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faDesktop, faUser } from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { useAuthInfo } from "@propelauth/react";
import { getTicket } from "../../../Services/tickets";
import moment from "moment";
import UpdateTicketForm from "../../../Components/Forms/UpdateTicketForm";
import MessagesPanel from "../../../Components/Messages/MessagesPanel";
import ClosureNotesForm from "../../../Components/Forms/ClosureNotesForm";
import MessageInput from "../../../Components/Messages/MessageInput";
import { useTicketSocket } from "../../../Hooks/useTicketSocket";
import Approvals from "../../../Components/Tickets/Approvals";

const Details = () => {
  const params = useParams();
  const { accessToken } = useAuthInfo();

  const ticketQuery = useQuery({
    queryKey: ["ticket", params.id],
    queryFn: () => getTicket(accessToken, params.id),
  });

  const ticket = ticketQuery.data;
  console.log("ticket", ticket);

  const [comments, setComments] = useState<any[]>([]);

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

  const convertApprovalsToComments = (approvals: any[]) => {
    const approvalComments = approvals.map((approval) => ({
      id: approval.id,
      type: "decision",
      createdAt: approval.createdAt,
      decidedAt: approval.decidedAt,
      author: approval.approver.distinguishedName,
      decision: approval.decision,
    }));
    return approvalComments;
  };

  const allComments = [
    ...comments,
    ...convertApprovalsToComments(ticket?.approvals || []),
  ];

  if (!ticket) return null;

  return (
    <div className="flex">
      <div className="w-[500px] bg-white shadow-xl rounded-[10px] p-4 my-4 ml-4">
        <CardHeader text={`${ticket.type} ${ticket.number}`} />

        <div className="py-1">
          <FontAwesomeIcon icon={faUser} className="w-[20px]" />
          <span className="ml-2 font-semibold">
            <Link to={`/users/${ticket.requester.id}`}>
              {ticket.requester.distinguishedName}
            </Link>
          </span>
        </div>

        <div className="py-1">
          <FontAwesomeIcon icon={faDesktop} className="w-[20px]" />
          <span className="ml-2 font-semibold">
            {ticket.device ? (
              <Link to={`/devices/${ticket.device.id}`}>
                {ticket.device.assetName || ticket.device.serialNumber}
              </Link>
            ) : (
              "N/A"
            )}
          </span>
        </div>

        <div className="py-1">
          <FontAwesomeIcon icon={faClock} className="w-[20px]" />
          <span className="ml-2 font-semibold">
            {moment(ticket.createdAt).format("MM/DD/YYYY, HH:mm")}
          </span>
        </div>

        <UpdateTicketForm {...ticket} />
      </div>

      <div className="w-full m-4">
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <div className="text-[14px] font-light">Description</div>
          <div className="font-bold">{ticket.description}</div>
        </div>

        <MessagesPanel comments={allComments} />

        <MessageInput
          ticketId={ticket.id}
          onOptimisticComment={(comment: any) =>
            setComments((prev) => [...prev, comment])
          }
        />
      </div>

      <div className="w-[500px] bg-white shadow-xl rounded-[10px] p-4 my-4 mr-4 overflow-y-auto max-h-[calc(100vh-100px)]">
        <CardHeader text="Closure notes" />
        <ClosureNotesForm
          closureCode={ticket.closureCode}
          closureNotes={ticket.closureNotes}
        />
        <CardHeader text="SLA" />
        <Approvals
          requesterId={ticket.requester.id}
          approvals={ticket.approvals}
        />
      </div>
    </div>
  );
};

export default Details;
