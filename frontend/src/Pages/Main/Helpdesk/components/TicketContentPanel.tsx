import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faGear } from "@fortawesome/free-solid-svg-icons";
import MessagesPanel from "./MessagesPanel";
import MessageInput from "./MessageInput";

interface TicketContentPanelProps {
  ticketId: string;
  description: string;
  allComments: any[];
  onOptimisticComment: (comment: any) => void;
  onInfoToggle: () => void;
  onSideToggle: () => void;
}

const TicketContentPanel = ({
  ticketId,
  description,
  allComments,
  onOptimisticComment,
  onInfoToggle,
  onSideToggle,
}: TicketContentPanelProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [allComments.length]);

  return (
    <div className="flex flex-col lg:flex-1 mx-4 my-4 lg:h-[calc(100vh-90px)]">
      <div className="lg:hidden flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onInfoToggle}
          className="flex items-center gap-1.5 text-[12px] font-bold text-[#3C3C3C] bg-white shadow rounded-[8px] px-3 py-2 border border-[#E0E0E0] hover:bg-[#F5F9FF]"
        >
          <FontAwesomeIcon icon={faCircleInfo} className="text-[#2B9AE9]" />
          {t("helpdesk.panel.info")}
        </button>
        <button
          type="button"
          onClick={onSideToggle}
          className="flex items-center gap-1.5 text-[12px] font-bold text-[#3C3C3C] bg-white shadow rounded-[8px] px-3 py-2 border border-[#E0E0E0] hover:bg-[#F5F9FF]"
        >
          {t("helpdesk.panel.details")}
          <FontAwesomeIcon icon={faGear} className="text-[#2B9AE9]" />
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4 shrink-0">
        <div className="text-[14px] font-light">{t("helpdesk.description")}</div>
        <div className="font-bold">{description}</div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-[300px] lg:min-h-0 overflow-y-auto py-2">
        <MessagesPanel comments={allComments} />
      </div>

      <div className="shrink-0">
        <MessageInput
          ticketId={ticketId}
          onOptimisticComment={onOptimisticComment}
        />
      </div>
    </div>
  );
};

export default TicketContentPanel;
