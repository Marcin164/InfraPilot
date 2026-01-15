import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import MainTable from "./MainTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";

type Props = {
  data: any[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;
  isLoading?: boolean;
};

const TicketsTable = ({
  data,
  total,
  page,
  limit,
  onPageChange,
  onRowsPerPageChange,
  isLoading,
}: Props) => {
  const navigate = useNavigate();

  const columns = [
    {
      cell: () => <FontAwesomeIcon icon={faTicket} />,
      width: "60px",
    },
    {
      name: "Number",
      selector: (row: any) => `${row.type} ${row.number}`,
    },
    {
      name: "Assignee",
      selector: (row: any) => row.assignee || "N/A",
    },
    {
      name: "Requester",
      selector: (row: any) => row.requesterId,
    },
    {
      name: "Urgency",
      selector: (row: any) => row.urgency,
    },
    {
      name: "Priority",
      selector: (row: any) => row.priority,
    },
    {
      name: "Impact",
      selector: (row: any) => row.impact,
    },
  ];

  return (
    <MainTable
      columns={columns}
      data={data}
      onRowClicked={(row: any) => navigate(`/helpdesk/${row.id}`)}
      paginationServer
      paginationTotalRows={total}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onRowsPerPageChange}
      progressPending={isLoading}
    />
  );
};

export default TicketsTable;
