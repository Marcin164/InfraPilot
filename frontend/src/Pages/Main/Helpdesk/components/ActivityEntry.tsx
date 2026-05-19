import React from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faExchangeAlt,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  user?: { distinguishedName: string };
  createdAt: string;
};

const FIELD_LABEL_KEYS: Record<string, string> = {
  state: "helpdesk.field.state",
  priority: "helpdesk.field.priority",
  impact: "helpdesk.field.impact",
  urgency: "helpdesk.field.urgency",
  assignee: "helpdesk.field.assignee",
  assignmentGroup: "helpdesk.field.assignmentGroup",
};

const ActivityEntry = ({
  id,
  field,
  oldValue,
  newValue,
  user,
  createdAt,
}: Props) => {
  const { t } = useTranslation();
  const label = FIELD_LABEL_KEYS[field] ? t(FIELD_LABEL_KEYS[field]) : field;
  const userName = user?.distinguishedName ?? "System";

  return (
    <div
      key={id}
      className="w-full min-[425px]:w-[60%] min-[425px]:ml-[20%] my-2 px-4 py-2 bg-[#F6F6F6] rounded-[10px] border border-[#E0E0E0] text-[13px]"
    >
      <div className="flex items-center gap-2 text-[#5A5A5A]">
        <FontAwesomeIcon
          icon={faExchangeAlt}
          className="text-[#8C8C8C] text-[11px]"
        />
        <span>
          <span className="font-semibold text-[#3C3C3C]">{userName}</span>
          {t("helpdesk.changed")}
          <span className="font-semibold">{label}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 mt-1 text-[13px]">
        {oldValue && (
          <span className="bg-[#FFFFFF] border border-[#D4D4D4] rounded px-2 py-0.5 text-[#7A7A7A] line-through">
            {oldValue}
          </span>
        )}
        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-[#B0B0B0] text-[10px]"
        />
        <span className="bg-[#FFFFFF] border border-[#2B9AE9] rounded px-2 py-0.5 text-[#2B9AE9] font-medium">
          {newValue ?? "—"}
        </span>
      </div>

      <div className="text-[11px] text-[#A0A0A0] mt-1">
        {moment(createdAt).format("DD/MM/YYYY, HH:mm")}
      </div>
    </div>
  );
};

export default ActivityEntry;
