import DataTable from "react-data-table-component";

const MainTable = ({
  columns,
  data,
  onRowClicked,
  className = "",
  paginationServer = false,
  paginationTotalRows,
  onChangePage,
  onChangeRowsPerPage,
  progressPending,
}: any) => {
  const customStyles = {
    table: {
      style: {
        width: "100%",
        background: "transparent",
        height: "80vh",
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
        borderBottomColor: "#eeeeee",
        transition: "all 0.2s ease-in-out",
        margin: "5px 0",
        borderRadius: "10px",
        fontSize: "14px",
        "&:hover": {
          backgroundColor: "#d2ecff",
        },
      },
    },
    pagination: {
      style: {
        background: "#FFFFFF00",
        borderTop: "0px",
      },
    },
  };

  return (
    <DataTable
      className={className}
      columns={columns}
      data={data}
      customStyles={customStyles}
      onRowClicked={onRowClicked}
      highlightOnHover
      pointerOnHover
      responsive
      fixedHeader
      pagination
      paginationServer={paginationServer}
      paginationTotalRows={paginationTotalRows}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      progressPending={progressPending}
    />
  );
};

export default MainTable;
