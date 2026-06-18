import HeadlessTable from "./HeadlessTable";

type Props = { data: any };

const UpdatesTable = ({ data }: Props) => {
  const columns = [
    {
      cell: (row: any) => <div className="font-semibold text-[#3C3C3C] text-[13px]">{row.hotfix_id}</div>,
      width: "120px",
    },
    {
      cell: (row: any) => <div className="text-[12px] text-[#9a9a9a] truncate">{row.description}</div>,
    },
    {
      cell: (row: any) => <div className="text-[12px] text-[#3C3C3C]">{row.installedOn}</div>,
      width: "120px",
    },
  ];

  return <HeadlessTable columns={columns} data={data} />;
};

export default UpdatesTable;
