import { useAuthInfo } from "@propelauth/react";
import moment from "moment";
import { twMerge } from "tailwind-merge";

type Props = { author: any; content: any; createdAt: any };

const Comment = ({ author, content, createdAt }: Props) => {
  const { user }: any = useAuthInfo();

  return (
    <div
      className={twMerge(
        "w-[48%] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 my-4",
        author.id === user?.metadata?.id && "ml-[52%] border-2 border-[#2B9AE9]"
      )}
    >
      <div className="text-[14px] font-light">{`${
        author?.distinguishedName
      } - ${moment(createdAt).format("DD/MM/YYYY, hh:mm")}`}</div>
      <div className="font-bold text-ellipsis">{content}</div>
    </div>
  );
};

export default Comment;
