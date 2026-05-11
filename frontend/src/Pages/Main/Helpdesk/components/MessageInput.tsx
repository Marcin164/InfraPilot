import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import {
  faFile,
  faMicrophone,
  faShare,
  faStop,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { toast } from "react-toastify";
import {
  createComment,
  createCommentWithAttachment,
  getTicket,
} from "../../../../Services/tickets";
import TemplatePicker from "./TemplatePicker";

import type { Comment } from "../../../../Types";

type Props = {
  ticketId: string;
  onOptimisticComment: (comment: Partial<Comment>) => void;
};

const ACCEPTED_TYPES = ".mp3,.mp4,.png,.jpg,.jpeg,.pdf,.wav,.webm,.ogg";
const ACCEPTED_MIMES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
]);

const MessageInput = ({ ticketId, onOptimisticComment }: Props) => {
  const { t } = useTranslation();
  const { user }: any = useAuthInfo();
  const ticketQuery = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: Boolean(ticketId),
    staleTime: 30000,
  });
  const [message, setMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textMutation = useMutation({
    mutationFn: async (payload: { content: string; type: string }) => {
      return createComment(ticketId, user?.metadata?.id, payload);
    },
    onMutate: () => {
      setMessage("");
    },
    onError: () => {
      toast.error(t("helpdesk.sendMessageFailed"));
    },
  });

  const fileMutation = useMutation({
    mutationFn: async (payload: {
      content?: string;
      type: string;
      file: File;
    }) => {
      return createCommentWithAttachment(ticketId, user?.metadata?.id, payload);
    },
    onMutate: async (payload) => {
      onOptimisticComment({
        content: payload.content,
        author: {
          id: user?.metadata?.id,
          distinguishedName: `${user?.firstName} ${user?.lastName}`,
        },
        type: payload.type,
        attachmentName: payload.file.name,
        attachmentMimetype: payload.file.type,
        attachmentSize: payload.file.size,
        optimistic: true,
      });
      setMessage("");
      clearPendingFile();
      clearRecording();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("helpdesk.sendAttachmentFailed"));
    },
  });

  const isPending = textMutation.isPending || fileMutation.isPending;

  const clearPendingFile = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
  };

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIMES.has(file.type)) {
      toast.error(t("helpdesk.unsupportedFile"));
      e.target.value = "";
      return;
    }

    clearRecording();
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        clearPendingFile();
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      toast.error(t("toast.error.micPermission"));
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const send = () => {
    if (isPending) return;

    if (pendingFile) {
      fileMutation.mutate({
        content: message.trim() || undefined,
        type: "Public",
        file: pendingFile,
      });
      return;
    }

    if (recordedBlob) {
      const ext = recordedBlob.type.includes("webm")
        ? "webm"
        : recordedBlob.type.includes("ogg")
          ? "ogg"
          : "wav";
      const file = new File([recordedBlob], `voice-${Date.now()}.${ext}`, {
        type: recordedBlob.type || "audio/webm",
      });
      fileMutation.mutate({
        content: message.trim() || undefined,
        type: "Public",
        file,
      });
      return;
    }

    if (!message.trim()) return;
    textMutation.mutate({ content: message, type: "Public" });
  };

  const canSend =
    !isPending && (pendingFile || recordedBlob || message.trim().length > 0);

  return (
    <div className="p-2 space-y-2">
      {(pendingFile || recordedBlob) && (
        <div className="flex items-center gap-2 bg-[#F6F6F6] rounded-[8px] p-2">
          {pendingFile &&
            pendingFile.type.startsWith("image/") &&
            pendingPreviewUrl && (
              <img
                src={pendingPreviewUrl}
                alt={pendingFile.name}
                className="h-12 w-12 object-cover rounded"
              />
            )}
          {pendingFile && !pendingFile.type.startsWith("image/") && (
            <span className="text-[14px] font-semibold text-[#3C3C3C]">
              {pendingFile.name}
            </span>
          )}
          {recordedBlob && recordedUrl && (
            <audio controls src={recordedUrl} className="flex-1" />
          )}
          <button
            type="button"
            onClick={() => {
              clearPendingFile();
              clearRecording();
            }}
            className="ml-auto text-[#7a7a7a] hover:text-[#BC0E0E] cursor-pointer"
            aria-label={t("helpdesk.removeAttachment")}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />
        <ButtonPrimary
          icon={faFile}
          className="shrink-0"
          onClick={handleFilePick}
          disabled={isPending || isRecording}
        />
        <ButtonPrimary
          icon={isRecording ? faStop : faMicrophone}
          className={`shrink-0 ${isRecording ? "text-[#BC0E0E]" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isPending}
        />
        <TemplatePicker
          ticket={ticketQuery.data}
          disabled={isPending || isRecording}
          onPick={(text) =>
            setMessage((prev) => (prev ? `${prev}\n\n${text}` : text))
          }
        />

        <textarea
          value={message}
          rows={1}
          placeholder={isRecording ? "Recording..." : "Write a message..."}
          className="flex-1 resize-none border border-[#EFEFEF] rounded-[10px] px-3 py-2 text-[14px] outline-none focus:border-[#2B9AE9] min-h-[44px] max-h-[200px] shadow-xl"
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />

        <ButtonPrimary
          icon={faShare}
          onClick={send}
          disabled={!canSend}
          className="shrink-0"
        />
      </div>
    </div>
  );
};

export default MessageInput;
