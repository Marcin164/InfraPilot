import { useTranslation } from "react-i18next";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { AttachmentRenderer } from "./Comment";

type Props = {
  id?: string;
  content?: string;
  createdAt: string;
  attachmentName?: string;
  attachmentMimetype?: string;
  attachmentSize?: number;
};

// Renders comments created by the system (workflow steps, no human author)
// the same way approvals/activity entries look -- centered, distinct from
// the left/right chat bubbles used for messages a person actually typed.
const SystemNote = ({
  id,
  content,
  createdAt,
  attachmentName,
  attachmentMimetype,
  attachmentSize,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="w-full min-[425px]:w-[60%] min-[425px]:ml-[20%] my-2 px-4 py-2 bg-[#F6F6F6] rounded-[10px] border border-[#E0E0E0] text-[13px]">
      <div className="flex items-center gap-2 text-[#5A5A5A]">
        <FontAwesomeIcon icon={faRobot} className="text-[#8C8C8C] text-[11px]" />
        <span className="font-semibold text-[#3C3C3C]">{t("helpdesk.system")}</span>
      </div>

      {content && <div className="mt-1 text-[#3C3C3C]">{content}</div>}

      {attachmentName && attachmentMimetype && (
        <div className={content ? "mt-2" : "mt-1"}>
          <AttachmentRenderer
            id={id}
            name={attachmentName}
            mime={attachmentMimetype}
            size={attachmentSize}
          />
        </div>
      )}

      <div className="text-[11px] text-[#A0A0A0] mt-1">
        {moment(createdAt).format("DD/MM/YYYY, HH:mm")}
      </div>
    </div>
  );
};

export default SystemNote;
