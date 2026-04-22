import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";

import { listPrivacyAccessLog } from "../../../../Services/privacy";
import CardHeader from "../../../../Components/Headers/CardHeader";
import MainTable from "../../../../Components/Tables/MainTable";
import Input from "../../../../Components/Inputs/Input";

const Privacy = () => {
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
        name: "When",
        selector: (row: any) =>
          moment(row.createdAt).format("DD.MM.YYYY HH:mm:ss"),
        width: "180px",
      },
      {
        id: "actor",
        name: "Actor",
        selector: (row: any) => row.metadata?.actor ?? "—",
      },
      {
        id: "target",
        name: "Target user",
        selector: (row: any) => row.entityId,
      },
      {
        id: "fields",
        name: "Fields read",
        cell: (row: any) => (
          <span className="text-[12px] text-[#7a7a7a]">
            {(row.metadata?.fields ?? []).join(", ") || "—"}
          </span>
        ),
        grow: 2,
      },
    ],
    [],
  );

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Privacy access log" icon={faUserShield} />
        <p className="text-[14px] text-[#7a7a7a] mt-2">
          Every read of personal data via the <em>View as DPO</em> dialog on a
          user's page is recorded here. Per-user data lookup has moved to the
          user detail page.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[520px]">
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFrom(e.target.value)
            }
          />
          <Input
            label="To"
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
