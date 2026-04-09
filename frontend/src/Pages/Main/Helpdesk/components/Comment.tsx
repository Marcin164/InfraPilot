import { useEffect, useState } from "react";
import { useAuthInfo } from "@propelauth/react";
import moment from "moment";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faDownload,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { fetchAttachmentBlob } from "../../../../Services/tickets";

type Props = {
  id?: string;
  author: any;
  content?: string;
  createdAt: any;
  attachmentName?: string;
  attachmentMimetype?: string;
  attachmentSize?: number;
  optimistic?: boolean;
};

const formatSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const useAttachmentUrl = (commentId?: string, hasMime?: boolean) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!commentId || !hasMime) return;

    let revoked = false;
    setLoading(true);

    fetchAttachmentBlob(commentId)
      .then((url) => {
        if (!revoked) setBlobUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {})
      .finally(() => {
        if (!revoked) setLoading(false);
      });

    return () => {
      revoked = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [commentId, hasMime]);

  return { blobUrl, loading };
};

const AttachmentRenderer = ({
  id,
  name,
  mime,
  size,
}: {
  id?: string;
  name: string;
  mime: string;
  size?: number;
}) => {
  const { blobUrl, loading } = useAttachmentUrl(id, !!mime);

  if (loading || !blobUrl) {
    return (
      <div className="flex items-center gap-2 text-[14px] text-[#7a7a7a] py-2">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Loading attachment...</span>
      </div>
    );
  }

  if (mime.startsWith("image/")) {
    return (
      <a
        href={blobUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={blobUrl}
          alt={name}
          className="max-w-full max-h-[300px] rounded-[8px] border border-[#EFEFEF]"
        />
      </a>
    );
  }

  if (mime.startsWith("audio/")) {
    return (
      <audio controls className="w-full">
        <source src={blobUrl} type={mime} />
      </audio>
    );
  }

  if (mime.startsWith("video/")) {
    return (
      <video controls className="max-w-full max-h-[360px] rounded-[8px]">
        <source src={blobUrl} type={mime} />
      </video>
    );
  }

  // Generic file (pdf, etc.) - download link
  return (
    <a
      href={blobUrl}
      download={name}
      className="inline-flex items-center gap-2 bg-[#F6F6F6] hover:bg-[#EFEFEF] rounded-[8px] px-3 py-2 text-[14px] text-[#3C3C3C] no-underline"
    >
      <FontAwesomeIcon icon={faFileLines} />
      <span className="font-semibold">{name}</span>
      {size ? (
        <span className="text-[#7a7a7a]">({formatSize(size)})</span>
      ) : null}
      <FontAwesomeIcon icon={faDownload} className="ml-1" />
    </a>
  );
};

const Comment = ({
  id,
  author,
  content,
  createdAt,
  attachmentName,
  attachmentMimetype,
  attachmentSize,
  optimistic,
}: Props) => {
  const { user }: any = useAuthInfo();

  return (
    <div
      className={twMerge(
        "w-[48%] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 my-4",
        author?.id === user?.metadata?.id &&
          "ml-[52%] border-2 border-[#2B9AE9]",
        optimistic && "opacity-60",
      )}
    >
      <div className="text-[14px] font-light">{`${
        author?.distinguishedName
      } - ${moment(createdAt).format("DD/MM/YYYY, HH:mm")}`}</div>
      {content && <div className="font-bold text-ellipsis">{content}</div>}
      {attachmentName && attachmentMimetype && !optimistic && (
        <div className={content ? "mt-2" : ""}>
          <AttachmentRenderer
            id={id}
            name={attachmentName}
            mime={attachmentMimetype}
            size={attachmentSize}
          />
        </div>
      )}
      {attachmentName && optimistic && (
        <div className={content ? "mt-2" : ""}>
          <div className="flex items-center gap-2 text-[14px] text-[#7a7a7a]">
            <FontAwesomeIcon icon={faFileLines} />
            <span>{attachmentName}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comment;
