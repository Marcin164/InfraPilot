import { useRef, useEffect } from "react";
import MessagesPanel from "./MessagesPanel";
import MessageInput from "./MessageInput";

interface TicketContentPanelProps {
  ticketId: string;
  description: string;
  allComments: any[];
  onOptimisticComment: (comment: any) => void;
}

const TicketContentPanel = ({
  ticketId,
  description,
  allComments,
  onOptimisticComment,
}: TicketContentPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [allComments.length]);

  return (
    <div className="flex flex-col w-full mx-4 my-4 h-[calc(100vh-90px)]">
      <div className="bg-white shadow-xl rounded-[10px] p-4 shrink-0">
        <div className="text-[14px] font-light">Description</div>
        <div className="font-bold">{description}</div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto py-2">
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
