import { twMerge } from "tailwind-merge";
import MainTable from "./MainTable";
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
          <div className="font-bold">{row.DisplayName}</div>
          <div className="font-light text-[12px]">{row.Name}</div>
        </div>
      ),
      width: "300px",
    },
    {
      name: "State",
      selector: (row: any) => row.DisplayName,
      width: "300px",
    },
    {
      name: "Enabled",
      cell: (row: any) => (
        <div
          className={twMerge(
            "w-[100px] py-2 rounded-[10px] text-center text-[#FFFFFF]",
            `bg-[${row.Enabled === 1 ? "#30A712" : "#BC0E0E"}]`
          )}
        >
          {row.Enabled === 1 ? "Enabled" : "Disabled"}
        </div>
      ),
    },
    {
      name: "Profile",
      cell: (row: any) => <span>{resolveProfile(row.Profile)}</span>,
    },
    {
      name: "Direction",
      cell: (row: any) => (
        <div>
          <FontAwesomeIcon
            icon={row.Direction === 1 ? faArrowRight : faArrowLeft}
            className={`font-bold text-[${
              row.Direction === 1 ? "#30A712" : "#BC0E0E"
            }]`}
          />
          <span className="ml-2">
            {row.Direction === 1 ? "Inbound" : "Outbound"}
          </span>
        </div>
      ),
    },
    {
      name: "Action",
      cell: (row: any) => (
        <span className="ml-2">{resolveAction(row.Action)}</span>
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
