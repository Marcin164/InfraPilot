import ApprovalDecision from "./ApprovalDecision";
import Comment from "./Comment";
import ActivityEntry from "./ActivityEntry";

type Props = { comments: any[] };

const MessagesPanel = ({ comments }: Props) => {
  const renderItem = (item: any) => {
    switch (item?.type) {
      case "decision":
        return <ApprovalDecision key={item.id} {...item} />;
      case "activity":
        return <ActivityEntry key={item.id} {...item} />;
      default:
        return <Comment key={item.id} {...item} />;
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
        .map((item: any) => renderItem(item))}
    </div>
  );
};

export default MessagesPanel;
