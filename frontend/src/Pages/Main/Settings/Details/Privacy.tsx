import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";

import { listPrivacyAccessLog } from "../../../../Services/privacy";
import CardHeader from "../../../../Components/Headers/CardHeader";
import MainTable from "../../../../Components/Tables/MainTable";
import Input from "../../../../Components/Inputs/Input";

const Privacy = () => {
  const { t } = useTranslation();
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const accessLogQuery = useQuery({
    queryKey: ["privacy-access-log-global", from, to],
    queryFn: () =>
      listPrivacyAccessLog({
        from: from || undefined,
        to: to || undefined,
        limit: 200,
      }),
  });

  const columns = useMemo(
    () => [
      {
        id: "when",
        name: t("settings.privacy.column.when"),
        selector: (row: any) =>
          moment(row.createdAt).format("DD.MM.YYYY HH:mm:ss"),
        width: "180px",
      },
      {
        id: "actor",
        name: t("settings.privacy.column.actor"),
        selector: (row: any) => row.metadata?.actor ?? "—",
      },
      {
        id: "target",
        name: t("settings.privacy.column.target"),
        selector: (row: any) => row.entityId,
      },
      {
        id: "fields",
        name: t("settings.privacy.column.fields"),
        cell: (row: any) => (
          <span className="text-[12px] text-[#7a7a7a]">
            {(row.metadata?.fields ?? []).join(", ") || "—"}
          </span>
        ),
        grow: 2,
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.privacy.title")} icon={faUserShield} />
        <p className="text-[14px] text-[#7a7a7a] mt-2">
          {t("settings.privacy.help")}
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[520px]">
          <Input
            label={t("settings.privacy.from")}
            type="date"
            value={from}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFrom(e.target.value)
            }
          />
          <Input
            label={t("settings.privacy.to")}
            type="date"
            value={to}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTo(e.target.value)
            }
          />
        </div>

        <div className="mt-4">
          <MainTable
            columns={columns}
            data={accessLogQuery.data?.items ?? []}
            progressPending={accessLogQuery.isFetching}
          />
        </div>
      </div>
    </div>
  );
};

export default Privacy;
