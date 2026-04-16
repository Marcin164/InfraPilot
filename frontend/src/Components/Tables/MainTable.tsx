import { motion, AnimatePresence } from "framer-motion";
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
    <AnimatePresence mode="wait">
      <motion.div
        key={progressPending ? "loading" : "loaded"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
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
      </motion.div>
    </AnimatePresence>
  );
};

export default MainTable;
