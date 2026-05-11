import React from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { useQuery } from "@tanstack/react-query";
import { getTicketSla } from "../../../../Services/sla";
import { useParams } from "react-router";
import { minutesToDaysHoursMinutes } from "../../../../Helpers/date";
import Badge from "../../../../Components/Badges/Badge";

type Props = {};

const SLA = (props: Props) => {
  const { t } = useTranslation();
  const params = useParams();

  const slaQuery = useQuery({
    queryKey: ["ticketSla", params.id],
    queryFn: () => getTicketSla(params.id!),
  });

  const sla = slaQuery?.data?.instances || [];

  if (!sla) return null;

  return (
    <div>
      <CardHeader text={t("helpdesk.sla")} />
      <div>
        {sla.map((item: any) => {
          let status = "#30A712";

          if (item.breached) status = "#BC0E0E";
          else if (item.paused) status = "#2B9AE9";
          else if (item.usedPercentage > 70) status = "#EAD21A";

          return (
            <div key={item.id} className="mb-4">
              <Badge
                className="text-[#FFFFFF] font-bold"
                style={{ background: status }}
                text={item.type}
              />

              <p className="mt-1 font-semibold">
                Remaining: {minutesToDaysHoursMinutes(item.remainingMinutes)}
              </p>
              <progress value={item.usedPercentage} max="100"></progress>

              {item.paused && <p>Paused</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SLA;
