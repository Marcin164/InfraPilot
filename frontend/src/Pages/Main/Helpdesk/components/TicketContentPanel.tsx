import React from "react";
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
  return (
    <div className="w-full m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="text-[14px] font-light">Description</div>
        <div className="font-bold">{description}</div>
      </div>

      <MessagesPanel comments={allComments} />

      <MessageInput
        ticketId={ticketId}
        onOptimisticComment={onOptimisticComment}
      />
    </div>
  );
};

export default TicketContentPanel;
