import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router";
import MainTable from "./MainTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { getUserSettings } from "../../Services/settings";

import type { Ticket } from "../../Types";

type Props = {
  data: Ticket[];
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (limit: number) => void;
  isLoading?: boolean;
};

const TicketsTable = ({
  data,
  total,
  onPageChange,
  onRowsPerPageChange,
  isLoading,
}: Props) => {
  const navigate = useNavigate();
  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  if (!userSettings.data || userSettings.isLoading) {
    return <div>Loading...</div>;
  }

  const iconColumn = {
    id: "icon",
    cell: () => <FontAwesomeIcon icon={faTicket} />,
    width: "60px",
  };

  const columns = [
    iconColumn,
    {
      id: "number",
      name: "Number",
      selector: (row: any) => `${row.type} ${row.number}`,
    },
    {
      id: "assignee",
      name: "Assignee",
      selector: (row: any) => row.assignee || "N/A",
    },
    {
      id: "requester",
      name: "Requester",
      cell: (row: any) =>
        row.requester ? (
          <Link
            to={`${row.requester.id}`}
            className="text-[#2B9AE9] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.requester.distinguishedName}
          </Link>
        ) : (
          "N/A"
        ),
      selector: (row: any) => row.requester?.distinguishedName || "N/A",
    },
    {
      id: "assignmentgroup",
      name: "Assignment group",
      selector: (row: any) => row.assignmentGroup || "N/A",
    },
    {
      id: "state",
      name: "State",
      selector: (row: any) => row.state || "N/A",
    },
    {
      id: "urgency",
      name: "Urgency",
      selector: (row: any) => row.urgency || "N/A",
    },
    {
      id: "priority",
      name: "Priority",
      selector: (row: any) => row.priority || "N/A",
    },
    {
      id: "impact",
      name: "Impact",
      selector: (row: any) => row.impact || "N/A",
    },
    {
      id: "device",
      name: "Device",
      selector: (row: any) => row.device || "N/A",
    },
    {
      id: "createdat",
      name: "Created at",
      selector: (row: any) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "N/A",
    },
    {
      id: "approvers",
      name: "Approvers",
      selector: (row: any) =>
        Array.isArray(row.approvers)
          ? row.approvers.join(", ")
          : row.approvers || "N/A",
    },
  ];

  const filterColumns = () => {
    const order = userSettings?.data?.ticketsTableColumnOrder;
    if (!order || order.length === 0) return columns;
    const filtered = order
      .map((columnId: string) =>
        columns.find((column: any) => column.id === columnId.toLowerCase()),
      )
      .filter(Boolean);
    return [iconColumn, ...filtered];
  };

  return (
    <MainTable
      columns={filterColumns()}
      data={data}
      onRowClicked={(row: any) => navigate(`/admin/helpdesk/${row.id}`)}
      paginationServer
      paginationTotalRows={total}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onRowsPerPageChange}
      progressPending={isLoading}
    />
  );
};

export default TicketsTable;
