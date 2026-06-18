import MainTable from "./MainTable";
import StatusPill from "../Badges/StatusPill";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

type Props = { data: any };

const FirewallRulesTable = ({ data }: Props) => {
  const resolveProfile = (profile: any) => {
    const profileNames = [
      "None",
      "Domain",
      "Private",
      "Domain & Private",
      "Public",
      "Domain & Public",
      "Private & Public",
      "All",
    ];

    return profileNames[profile];
  };

  const resolveAction = (action: any) => {
    const actionNames = ["Not Configured", "Allow", "Block"];

    return actionNames[action];
  };

  const columns = [
    {
      name: "Name",
      cell: (row: any) => (
        <div>
          <div className="font-semibold text-[#3C3C3C]">{row.DisplayName}</div>
          <div className="font-light text-[12px] text-[#9a9a9a]">{row.Name}</div>
        </div>
      ),
      width: "320px",
    },
    {
      name: "Enabled",
      cell: (row: any) => (
        <StatusPill
          tone={row.Enabled === 1 ? "green" : "red"}
          text={row.Enabled === 1 ? "Enabled" : "Disabled"}
        />
      ),
    },
    {
      name: "Profile",
      cell: (row: any) => <span>{resolveProfile(row.Profile)}</span>,
    },
    {
      name: "Direction",
      cell: (row: any) => (
        <div className={row.Direction === 1 ? "text-[#30A712]" : "text-[#BC0E0E]"}>
          <FontAwesomeIcon icon={row.Direction === 1 ? faArrowRight : faArrowLeft} />
          <span className="ml-2 text-[#3C3C3C]">
            {row.Direction === 1 ? "Inbound" : "Outbound"}
          </span>
        </div>
      ),
    },
    {
      name: "Action",
      cell: (row: any) => (
        <span className="text-[#3C3C3C]">{resolveAction(row.Action)}</span>
      ),
    },
  ];

  if (!data || typeof data == "string") return <div>No data</div>;

  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => {}}
      className="h-[calc(100vh-270px)]"
    />
  );
};

export default FirewallRulesTable;
