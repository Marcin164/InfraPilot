import DataTable from "react-data-table-component";

type Props = {
  columns: any;
  data: any;
  onRowClicked: any;
};

const MainTable = ({ columns, data, onRowClicked }: Props) => {
  const customStyles = {
    table: {
      style: {
        width: "100%",
        background: "transparent",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#FFFFFF",
        fontWeight: "bold",
        borderRadius: "10px",
        fontSize: "16px",
      },
    },
    rows: {
      style: {
        minHeight: "48px",
        borderBottomColor: "#eee",
        transition: "all 0.2s ease-in-out",
        margin: "5px 0 5px 0",
        borderRadius: "10px",
        fontSize: "14px",
        "&:hover": {
          backgroundColor: "#d2ecff", // NIEBIESKI hover
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: "#d2ecff",
        outline: "none",
      },
      pagination: {
        style: {
          background: "#FFFFFF00",
          borderTop: "0px",
        },
      },
    },
  };
  return (
    <DataTable
      className=""
      pagination
      columns={columns}
      data={data}
      customStyles={customStyles}
      onRowClicked={onRowClicked}
      highlightOnHover
      pointerOnHover
      responsive
    />
  );
};

export default MainTable;
