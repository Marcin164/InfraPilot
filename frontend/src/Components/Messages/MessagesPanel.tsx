import Comment from "./Comment";

type Props = { comments: any[] };

const MessagesPanel = ({ comments }: Props) => {
  return (
    <div className="py-2 overscroll-contain overflow-y-scroll max-h-[80%]">
      {comments.map((comment: any) => (
        <Comment key={comment.id} {...comment} />
      ))}
    </div>
  );
};

export default MessagesPanel;
