import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faDesktop, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router";
import moment from "moment";
import UpdateTicketForm from "../../../../Components/Forms/UpdateTicketForm";
import DeviceContextPanel from "./DeviceContextPanel";
import QuickActions from "./QuickActions";
import TicketDiagnostics from "./TicketDiagnostics";
import PreviousTicketsPanel from "./PreviousTicketsPanel";
import LinkTicketPanel from "./LinkTicketPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import AIAssistPanel from "./AIAssistPanel";

interface TicketInfoPanelProps {
  ticket: {
    id: string;
    type: string;
    number: string;
    state: string;
    assignee?: string | null;
    requester?: { id: string; distinguishedName: string } | null;
    requesterId?: string | null;
    device?: { id: string; assetName?: string; serialNumber: string } | null;
    createdAt: string;
    [key: string]: any;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

const TicketInfoPanel = ({ ticket, isOpen = false, onClose }: TicketInfoPanelProps) => {
  const { t } = useTranslation();
  return (
    <div className={`fixed top-0 left-0 h-screen z-40 w-[85vw] max-w-[420px] bg-white overflow-y-auto p-4 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} lg:static lg:translate-x-0 lg:shadow-xl lg:rounded-[10px] lg:w-[340px] xl:w-[400px] lg:flex-shrink-0 lg:ml-4 lg:my-4 lg:h-[calc(100vh-90px)]`}>
      <button
        type="button"
        onClick={onClose}
        className="lg:hidden absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F0F0] text-[#535353]"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
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
          {ticket.requester ? (
            <Link to={`/admin/users/${ticket.requester.id}`}>
              {ticket.requester.distinguishedName}
            </Link>
          ) : ticket.requesterId ? (
            <span className="text-[#9a9a9a] italic">{t("common.deletedUser")}</span>
          ) : (
            <span className="text-[#9a9a9a]">{t("common.na")}</span>
          )}
        </span>
        {ticket.requester?.isVip && (
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
            t("common.na")
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

      <AIAssistPanel ticket={ticket} />

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
