import MainTable from "./MainTable";
import StatusPill, { StatusTone } from "../Badges/StatusPill";

type Props = { data: any };

const UsersProfilesTable = ({ data }: Props) => {
  if (!data) return null;

  const parseStatus = ["OK", "Error", "Degraded", "Unknown"];
  const parseHealth: Record<number, { tone: StatusTone; text: string }> = {
    0: { tone: "gray", text: "Unknown" },
    1: { tone: "green", text: "Healthy" },
    2: { tone: "red", text: "Degraded" },
    3: { tone: "amber", text: "Warning" },
    4: { tone: "red", text: "Unhealthy" },
  };

  const columns = [
    {
      name: "Path",
      cell: (row: any) => <span className="font-semibold text-[#3C3C3C]">{row.LocalPath}</span>,
      width: "300px",
    },
    {
      name: "Last Use",
      selector: (row: any) => row.LastUseTime,
    },
    {
      name: "Health",
      cell: (row: any) => {
        const health = parseHealth[row.HealthStatus] ?? parseHealth[0];
        return <StatusPill tone={health.tone} text={health.text} />;
      },
    },
    {
      name: "Loaded",
      cell: (row: any) => (
        <StatusPill tone={row.Loaded ? "green" : "gray"} text={row.Loaded ? "Yes" : "No"} />
      ),
    },
    {
      name: "Status",
      selector: (row: any) => parseStatus[row.Status] ?? "Unknown",
    },
    {
      name: "Special",
      cell: (row: any) => (
        <StatusPill tone={row.Special ? "blue" : "gray"} text={row.Special ? "Yes" : "No"} />
      ),
    },
  ];
  return <MainTable columns={columns} data={data} />;
};

export default UsersProfilesTable;
