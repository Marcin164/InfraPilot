import React, { useState } from "react";
import Input from "../../../../Components/Inputs/Input";
import ButtonSecondary from "../../../../Components/Buttons/ButtonSecondary";
import {
  faFile,
  faMicrophone,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { useMutation } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { toast } from "react-toastify";
import { createComment } from "../../../../Services/tickets";


import type { Comment } from "../../../../Types";

type Props = {
  ticketId: string;
  onOptimisticComment: (comment: Partial<Comment>) => void;
};

const MessageInput = ({ ticketId, onOptimisticComment }: Props) => {
  const { user }: any = useAuthInfo();
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async (payload: { content: string; type: string }) => {
      return createComment(ticketId, user?.metadata?.id, payload);
    },

    onMutate: async (payload) => {
      const optimistic = {
        content: payload.content,
        author: {
          id: user?.metadata?.id,
          distinguishedName: `${user?.firstName} ${user?.lastName}`,
        },
        type: payload.type,
        optimistic: true,
      };

      onOptimisticComment(optimistic);
      setMessage("");
    },

    onError: () => {
      toast.error("Failed to send message");
    },
  });

  return (
    <div className="flex items-stretch justify-end">
      <ButtonSecondary icon={faFile} className="mr-2" />
      <ButtonSecondary icon={faMicrophone} className="mr-2" />

      <Input
        value={message}
        className="p-0 mr-2 w-full"
        inputClassName="mt-0 border-0 shadow-xl"
        onChange={(e: any) => setMessage(e.target.value)}
      />

      <ButtonSecondary
        icon={faShare}
        onClick={() =>
          mutation.mutate({
            content: message,
            type: "Public",
          })
        }
        disabled={!message.trim() || mutation.isPending}
      />
    </div>
  );
};

export default MessageInput;
