import MainTable from "./MainTable";

type Props = { data: any };

const FeaturesTable = ({ data }: Props) => {
  const columns = [
    {
      cell: (row: any) => <div className="">{row.image}</div>,
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => <div className="font-bold">{row.FeatureName}</div>,
      width: "400px",
    },
    {
      name: "State",
      selector: (row: any) => row.State,
    },
    {
      name: "Online",
      selector: (row: any) => row.Online,
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
