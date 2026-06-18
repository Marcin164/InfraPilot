import MainTable from "./MainTable";
import StatusPill from "../Badges/StatusPill";

type Props = { data: any };

const FeaturesTable = ({ data }: Props) => {
  const columns = [
    {
      name: "Name",
      cell: (row: any) => (
        <div className="font-semibold text-[#3C3C3C]">{row.FeatureName}</div>
      ),
      width: "400px",
    },
    {
      name: "State",
      cell: (row: any) => (
        <StatusPill
          tone={row.State === "Enabled" ? "green" : "gray"}
          text={row.State ?? "Unknown"}
        />
      ),
    },
    {
      name: "Online",
      cell: (row: any) => (
        <StatusPill tone={row.Online ? "blue" : "gray"} text={row.Online ? "Yes" : "No"} />
      ),
    },
    {
      name: "LogPath",
      selector: (row: any) => row.LogPath,
    },
  ];

  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => {}}
      className="h-[calc(100vh-270px)]"
    />
  );
};

export default FeaturesTable;
