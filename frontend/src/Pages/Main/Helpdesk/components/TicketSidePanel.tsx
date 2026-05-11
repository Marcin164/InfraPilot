import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ClosureNotesForm from "../../../../Components/Forms/ClosureNotesForm";
import SLA from "./SLA";
import Approvals from "./Approvals";
import type { Approval, ClosureCode } from "../../../../Types";

interface TicketSidePanelProps {
  closureCode?: ClosureCode;
  closureNotes?: string;
  requesterId: string;
  approvals: Approval[];
}

const TicketSidePanel = ({
  closureCode,
  closureNotes,
  requesterId,
  approvals,
}: TicketSidePanelProps) => {
  const { t } = useTranslation();
  return (
    <div className="w-[500px] bg-white shadow-xl rounded-[10px] p-4 my-4 mr-4 overflow-y-auto max-h-[calc(100vh-100px)]">
      <CardHeader text={t("helpdesk.closureNotes")} />
      <ClosureNotesForm closureCode={closureCode} closureNotes={closureNotes} />
      <SLA />
      <Approvals requesterId={requesterId} approvals={approvals} />
    </div>
  );
};

export default TicketSidePanel;
