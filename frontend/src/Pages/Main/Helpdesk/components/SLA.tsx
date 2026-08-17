import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import {
  faCircleCheck,
  faPause,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { getTicketSla } from "../../../../Services/sla";
import { useParams } from "react-router";
import { minutesToDaysHoursMinutes } from "../../../../Helpers/date";
import StatusPill, { StatusTone } from "../../../../Components/Badges/StatusPill";

type Props = {};

const TONE_BAR_COLOR: Record<StatusTone, string> = {
  red: "#F3606E",
  blue: "#2B9AE9",
  amber: "#F1C40F",
  green: "#30A712",
  gray: "#9a9a9a",
};

const SLA = (props: Props) => {
  const { t } = useTranslation();
  const params = useParams();

  const slaQuery = useQuery({
    queryKey: ["ticketSla", params.id],
    queryFn: () => getTicketSla(params.id!),
  });

  const sla = slaQuery?.data?.instances || [];

  if (sla.length === 0) {
    return <div className="text-[13px] text-[#9a9a9a]">{t("helpdesk.sla.none")}</div>;
  }

  return (
    <div className="space-y-3">
      {sla.map((item: any) => {
        const tone: StatusTone = item.breached
          ? "red"
          : item.paused
            ? "blue"
            : item.usedPercentage > 70
              ? "amber"
              : "green";

        return (
          <div key={item.id} className="rounded-[10px] border border-[#F0F0F0] p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <StatusPill
                text={item.type}
                tone={tone}
                icon={
                  item.breached
                    ? faTriangleExclamation
                    : item.paused
                      ? faPause
                      : faCircleCheck
                }
              />
              {item.paused && !item.breached && (
                <span className="text-[11px] font-bold text-[#2B9AE9] uppercase">
                  {t("helpdesk.sla.paused")}
                </span>
              )}
            </div>

            <div className="h-2 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, item.usedPercentage))}%`,
                  backgroundColor: TONE_BAR_COLOR[tone],
                }}
              />
            </div>

            <div className="mt-1.5 text-[12px] font-semibold text-[#3C3C3C]">
              {item.breached ? (
                item.respondedAt ? (
                  t("helpdesk.sla.respondedLate", {
                    time: moment(item.respondedAt).format("DD/MM/YYYY, HH:mm"),
                  })
                ) : (
                  t("helpdesk.sla.breached")
                )
              ) : (
                t("helpdesk.sla.remaining", {
                  time: minutesToDaysHoursMinutes(item.remainingMinutes),
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SLA;
