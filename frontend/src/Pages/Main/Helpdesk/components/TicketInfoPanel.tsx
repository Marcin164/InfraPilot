import React from "react";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faDesktop, faUser } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router";
import moment from "moment";
import UpdateTicketForm from "../../../../Components/Forms/UpdateTicketForm";
import DeviceContextPanel from "./DeviceContextPanel";
import QuickActions from "./QuickActions";
import TicketDiagnostics from "./TicketDiagnostics";
import PreviousTicketsPanel from "./PreviousTicketsPanel";
import LinkTicketPanel from "./LinkTicketPanel";
import SuggestionsPanel from "./SuggestionsPanel";

interface TicketInfoPanelProps {
  ticket: {
    id: string;
    type: string;
    number: string;
    state: string;
    assignee?: string | null;
    requester: { id: string; distinguishedName: string };
    device?: { id: string; assetName?: string; serialNumber: string } | null;
    createdAt: string;
    [key: string]: any;
  };
}

const TicketInfoPanel = ({ ticket }: TicketInfoPanelProps) => {
  return (
    <div className="w-[500px] h-fit bg-white shadow-xl rounded-[10px] p-4 my-4 ml-4">
      <CardHeader text={`${ticket.type} ${ticket.number}`} />

      <QuickActions
        ticket={{
          id: ticket.id,
          state: ticket.state,
          assignee: ticket.assignee,
        }}
      />

      <div className="py-1 flex items-center gap-2">
        <FontAwesomeIcon icon={faUser} className="w-[20px]" />
        <span className="font-semibold">
          <Link to={`/admin/users/${ticket.requester.id}`}>
            {ticket.requester.distinguishedName}
          </Link>
        </span>
        {(ticket.requester as any)?.isVip && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white bg-[#C0392B]">
            ★ VIP
          </span>
        )}
      </div>

      <div className="py-1">
        <FontAwesomeIcon icon={faDesktop} className="w-[20px]" />
        <span className="ml-2 font-semibold">
          {ticket.device ? (
            <Link to={`/admin/devices/${ticket.device.id}/system`}>
              {ticket.device.assetName || ticket.device.serialNumber}
            </Link>
          ) : (
            "N/A"
          )}
        </span>
      </div>

      <DeviceContextPanel
        deviceId={ticket.device?.id ?? null}
        ticketId={ticket.id}
      />

      {ticket.device?.id && (
        <TicketDiagnostics
          ticketId={ticket.id}
          deviceId={ticket.device.id}
        />
      )}

      <PreviousTicketsPanel
        ticketId={ticket.id}
        requesterId={ticket.requester?.id ?? null}
        deviceId={ticket.device?.id ?? null}
      />

      <LinkTicketPanel ticket={ticket} />

      <SuggestionsPanel ticket={ticket} />

      <div className="py-1 mt-3">
        <FontAwesomeIcon icon={faClock} className="w-[20px]" />
        <span className="ml-2 font-semibold">
          {moment(ticket.createdAt).format("MM/DD/YYYY, HH:mm")}
        </span>
      </div>

      <UpdateTicketForm {...ticket} />
    </div>
  );
};

export default TicketInfoPanel;
