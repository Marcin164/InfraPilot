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

const STATE_KEY: Record<string, string> = {
  New: "options.ticket.state.new",
  Assigned: "options.ticket.state.assigned",
  "In progress": "options.ticket.state.inProgress",
  "Awaiting for user": "options.ticket.state.awaitingForUser",
  "Awaiting for vendor": "options.ticket.state.awaitingForVendor",
  Resolved: "options.ticket.state.resolved",
  Closed: "options.ticket.state.closed",
  Cancelled: "options.ticket.state.cancelled",
};

const PRIORITY_KEY: Record<string, string> = {
  Low: "form.priority.low",
  Medium: "form.priority.medium",
  High: "form.priority.high",
  Critical: "form.priority.critical",
};

const IMPACT_KEY: Record<string, string> = {
  "Single user": "options.ticket.impact.singleUser",
  "Multiple users": "options.ticket.impact.multipleUsers",
  "Whole company": "options.ticket.impact.wholeCompany",
};

const URGENCY_KEY: Record<string, string> = {
  Low: "options.ticket.urgency.low",
  Medium: "options.ticket.urgency.medium",
  High: "options.ticket.urgency.high",
};

const TYPE_KEY: Record<string, string> = {
  Incident: "form.ticketType.incident",
  Service: "form.ticketType.service",
};

const TicketsTable = ({
  data,
  total,
  onPageChange,
  onRowsPerPageChange,
  isLoading,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  if (!userSettings.data || userSettings.isLoading) {
    return <div>{t("common.loading2")}</div>;
  }

  const na = t("common.na");
  const tr = (map: Record<string, string>, value?: string | null) => {
    if (!value) return na;
    const key = map[value];
    return key ? t(key) : value;
  };

  const slaLabel = (ms: number, hrs: number) => {
    if (hrs < 1) {
      const minutes = Math.max(0, Math.round(ms / 60000));
      return t("helpdesk.sla.in", { time: t("helpdesk.sla.minutes", { count: minutes }) });
    }
    if (hrs < 48) {
      return t("helpdesk.sla.in", { time: t("helpdesk.sla.hours", { count: Math.round(hrs) }) });
    }
    return t("helpdesk.sla.in", { time: t("helpdesk.sla.days", { count: Math.round(hrs / 24) }) });
  };

  const iconColumn = {
    id: "icon",
    cell: () => <FontAwesomeIcon icon={faTicket} />,
    width: "60px",
  };

  const columns = [
    iconColumn,
    {
      id: "number",
      name: t("helpdesk.column.number"),
      selector: (row: any) => `${tr(TYPE_KEY, row.type)} ${row.number}`,
    },
    {
      id: "assignee",
      name: t("helpdesk.column.assignee"),
      selector: (row: any) => row.assignee || na,
    },
    {
      id: "requester",
      name: t("helpdesk.column.requester"),
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
          na
        ),
      selector: (row: any) => row.requester?.distinguishedName || na,
    },
    {
      id: "assignmentgroup",
      name: t("helpdesk.column.assignmentGroup"),
      selector: (row: any) => row.assignmentGroup || na,
    },
    {
      id: "state",
      name: t("helpdesk.column.state"),
      selector: (row: any) => tr(STATE_KEY, row.state),
    },
    {
      id: "urgency",
      name: t("helpdesk.column.urgency"),
      selector: (row: any) => tr(URGENCY_KEY, row.urgency),
    },
    {
      id: "priority",
      name: t("helpdesk.column.priority"),
      selector: (row: any) => tr(PRIORITY_KEY, row.priority),
    },
    {
      id: "impact",
      name: t("helpdesk.column.impact"),
      selector: (row: any) => tr(IMPACT_KEY, row.impact),
    },
    {
      id: "device",
      name: t("helpdesk.column.device"),
      selector: (row: any) => row.device || na,
    },
    {
      id: "createdat",
      name: t("helpdesk.column.createdAt"),
      selector: (row: any) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : na,
    },
    {
      id: "sla",
      name: t("helpdesk.column.sla"),
      cell: (row: any) => {
        const sla = row.sla;
        if (!sla) return <span className="text-[#9a9a9a]">—</span>;
        if (sla.breached) {
          return (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white bg-[#C0392B]">
              {t("helpdesk.sla.breached")}
            </span>
          );
        }
        if (sla.paused) {
          return (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-[#8A8A8A] border border-[#D0D0D0]">
              {t("helpdesk.sla.paused")}
            </span>
          );
        }
        const ms = new Date(sla.dueAt).getTime() - Date.now();
        const hrs = ms / 3600000;
        const color =
          hrs < 1 ? "#C0392B" : hrs < 4 ? "#F3606E" : hrs < 24 ? "#F1C40F" : "#30A712";
        return (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ color, border: `1px solid ${color}` }}
            title={t("helpdesk.sla.breachesAt", { date: new Date(sla.dueAt).toLocaleString() })}
          >
            {slaLabel(ms, hrs)}
          </span>
        );
      },
      width: "110px",
    },
    {
      id: "approvers",
      name: t("helpdesk.column.approvers"),
      selector: (row: any) =>
        Array.isArray(row.approvers)
          ? row.approvers.join(", ")
          : row.approvers || na,
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
