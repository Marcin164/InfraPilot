import React from "react";
import { useTranslation } from "react-i18next";
import CollapsibleSection from "../../../../Components/Layout/CollapsibleSection";
import ClosureNotesForm from "../../../../Components/Forms/ClosureNotesForm";
import SLA from "./SLA";
import Approvals from "./Approvals";
import DeviceContextPanel from "./DeviceContextPanel";
import TicketDiagnostics from "./TicketDiagnostics";
import PreviousTicketsPanel from "./PreviousTicketsPanel";
import LinkTicketPanel from "./LinkTicketPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import AIAssistPanel from "./AIAssistPanel";
import type { Approval, ClosureCode } from "../../../../Types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlagCheckered,
  faStopwatch,
  faToolbox,
  faUserCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface TicketSidePanelProps {
  ticket: any;
  closureCode?: ClosureCode;
  closureNotes?: string;
  requesterId: string;
  approvals: Approval[];
  isOpen?: boolean;
  onClose?: () => void;
}

const TicketSidePanel = ({
  ticket,
  closureCode,
  closureNotes,
  requesterId,
  approvals,
  isOpen = false,
  onClose,
}: TicketSidePanelProps) => {
  const { t } = useTranslation();
  return (
    <div className={`fixed top-0 right-0 h-screen z-40 w-[85vw] max-w-[420px] bg-white overflow-y-auto p-4 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"} lg:static lg:translate-x-0 lg:shadow-xl lg:rounded-[10px] lg:w-[340px] xl:w-[400px] lg:flex-shrink-0 lg:mr-4 lg:my-4 lg:max-h-[calc(100vh-100px)]`}>
      <button
        type="button"
        onClick={onClose}
        className="lg:hidden absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F0F0] text-[#535353]"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
      <CollapsibleSection
        title={t("helpdesk.closureNotes")}
        icon={faFlagCheckered}
        defaultOpen
        className="mt-0 pt-0 border-t-0"
      >
        <ClosureNotesForm closureCode={closureCode} closureNotes={closureNotes} />
      </CollapsibleSection>

      <CollapsibleSection title={t("helpdesk.sla")} icon={faStopwatch} defaultOpen>
        <SLA />
      </CollapsibleSection>

      <CollapsibleSection title={t("helpdesk.approvals")} icon={faUserCheck} defaultOpen>
        <Approvals requesterId={requesterId} approvals={approvals} />
      </CollapsibleSection>

      <CollapsibleSection title={t("helpdesk.contextAndTools")} icon={faToolbox}>
        <DeviceContextPanel
          deviceId={ticket?.device?.id ?? null}
          ticketId={ticket?.id}
        />

        {ticket?.device?.id && (
          <TicketDiagnostics ticketId={ticket.id} deviceId={ticket.device.id} />
        )}

        <PreviousTicketsPanel
          ticketId={ticket?.id}
          requesterId={ticket?.requester?.id ?? null}
          deviceId={ticket?.device?.id ?? null}
        />

        <LinkTicketPanel ticket={ticket} />
        <SuggestionsPanel ticket={ticket} />
        <AIAssistPanel ticket={ticket} />
      </CollapsibleSection>
    </div>
  );
};

export default TicketSidePanel;
