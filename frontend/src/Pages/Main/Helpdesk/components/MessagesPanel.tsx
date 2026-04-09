import ApprovalDecision from "./ApprovalDecision";
import Comment from "./Comment";

type Props = { comments: any[] };

const MessagesPanel = ({ comments }: Props) => {
  const renderComments = (comment: any) => {
    switch (comment?.type) {
      case "decision":
        return <ApprovalDecision {...comment} />;
      default:
        return <Comment key={comment.id} {...comment} />;
    }
  };

  return (
    <div className="h-full">
      {comments
        .sort((a, b) => {
          const dateA = new Date(a.decidedAt || a.createdAt).getTime();
          const dateB = new Date(b.decidedAt || b.createdAt).getTime();
          return dateA - dateB;
        })
        .map((comment: any) => renderComments(comment))}
    </div>
  );
};

export default MessagesPanel;
