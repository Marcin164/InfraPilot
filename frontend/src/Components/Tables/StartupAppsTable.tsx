import HeadlessTable from "./HeadlessTable";

type Props = { data: any };

const StartupAppsTable = ({ data }: Props) => {
  const columns = [
    {
      cell: (row: any) => <div className="font-semibold text-[#3C3C3C] text-[13px]">{row.name}</div>,
      width: "180px",
    },
    {
      cell: (row: any) => <div className="text-[12px] text-[#9a9a9a] truncate">{row.location}</div>,
      width: "180px",
    },
    {
      cell: (row: any) => <div className="text-[12px] text-[#3C3C3C] truncate">{row.command}</div>,
    },
  ];

  return <HeadlessTable columns={columns} data={data} />;
};

export default StartupAppsTable;
