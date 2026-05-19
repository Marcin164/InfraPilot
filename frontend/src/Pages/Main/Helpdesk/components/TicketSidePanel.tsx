import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ClosureNotesForm from "../../../../Components/Forms/ClosureNotesForm";
import SLA from "./SLA";
import Approvals from "./Approvals";
import type { Approval, ClosureCode } from "../../../../Types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface TicketSidePanelProps {
  closureCode?: ClosureCode;
  closureNotes?: string;
  requesterId: string;
  approvals: Approval[];
  isOpen?: boolean;
  onClose?: () => void;
}

const TicketSidePanel = ({
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
      <CardHeader text={t("helpdesk.closureNotes")} />
      <ClosureNotesForm closureCode={closureCode} closureNotes={closureNotes} />
      <SLA />
      <Approvals requesterId={requesterId} approvals={approvals} />
    </div>
  );
};

export default TicketSidePanel;
