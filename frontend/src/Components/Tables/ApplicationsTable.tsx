import MainTable from "./MainTable";
import { useNavigate } from "react-router";
import { getSearchedData, getFilteredData } from "../../Helpers/tables";

type Props = { data: any; filterOptions: any; searchValue: any };

const ApplicationsTable = ({ data, filterOptions, searchValue }: Props) => {
  let navigate = useNavigate();

  const columns = [
    {
      cell: (row: any) => <div className="">{row.image}</div>,
      width: "60px",
    },
    {
      name: "Name",
      cell: (row: any) => <div className="font-bold">{row.name}</div>,
    },
    {
      name: "Version",
      selector: (row: any) => row.version,
    },
    {
      name: "Publisher",
      selector: (row: any) => row.publisher,
    },
    {
      name: "Size",
      selector: (row: any) => row.size,
    },
    {
      name: "Installed on devices",
      selector: (row: any) => row.count,
    },
  ];

  return (
    <MainTable
      columns={columns}
      data={getFilteredData(getSearchedData(data, searchValue), filterOptions)}
      onRowClicked={(row: any) =>
        navigate(`/applications/${row.id}`, {
          state: { changeValue: row.name, changeIndex: row.id },
        })
      }
    />
  );
};

export default ApplicationsTable;
