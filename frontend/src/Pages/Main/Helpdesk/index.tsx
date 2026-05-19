import React, { useState } from "react";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import TableSettings from "../../../Components/TableSettings";
import { getTickets, getTicketsFilters } from "../../../Services/tickets";
import { buildQuery } from "../../../Helpers/queries";
import { useDebounce } from "../../../Hooks/useDebounce";
import TicketsTable from "../../../Components/Tables/TicketsTable";
import { getUserSettings } from "../../../Services/settings";
import { useFilterPresets } from "../../../Hooks/useFilterPresets";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import FilterPresetsBar from "../../../Components/Filter/FilterPresetsBar";

type TicketFilters = {
  type?: string[];
  priority?: string[];
  impact?: string[];
  urgency?: string[];
  state?: string[];
  assignee?: string[];
  assignmentGroup?: string[];
};

const Index = () => {
  const { t } = useTranslation();
  const authInfo: any = useAuthInfo();
  const myId = authInfo?.user?.metadata?.id ?? authInfo?.user?.userId ?? null;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [onlyMine, setOnlyMine] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);

  const presets = useFilterPresets("tickets", filters, (next) => {
    setFilters(next as TicketFilters);
    setPage(1);
  });

  const dynamicFiltersQuery = useQuery({
    queryKey: ["ticketsFilters"],
    queryFn: () => getTicketsFilters(),
  });

  const filterOptions = {
    type: ["Incident", "Service"],
    priority: ["Low", "Medium", "High", "Critical"],
    impact: ["Single user", "Multiple users", "Whole company"],
    urgency: ["Low", "Medium", "High"],
    state: [
      "New",
      "Assigned",
      "In progress",
      "Awaiting for user",
      "Awaiting for vendor",
      "Resolved",
      "Closed",
      "Cancelled",
    ],
    assignee: dynamicFiltersQuery.data?.assignee ?? [],
    assignmentGroup: dynamicFiltersQuery.data?.assignmentGroup ?? [],
  };

  const queryString = buildQuery({
    ...filters,
    ...(onlyMine && myId ? { assignee: [myId] } : {}),
    search: debouncedSearch,
    page,
    limit,
    current: filters.state && filters.state.length > 0 ? "false" : "true",
  });

  const helpdeskQuery = useQuery({
    queryKey: ["helpdesk", filters, debouncedSearch, page, limit],
    queryFn: () => getTickets(queryString),
    placeholderData: (prev) => prev,
  });

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const checkboxes = [
    { name: "number", label: t("helpdesk.column.number") },
    { name: "assignee", label: t("helpdesk.column.assignee") },
    { name: "requester", label: t("helpdesk.column.requester") },
    { name: "assignmentgroup", label: t("helpdesk.column.assignmentGroup") },
    { name: "state", label: t("helpdesk.column.state") },
    { name: "urgency", label: t("helpdesk.column.urgency") },
    { name: "priority", label: t("helpdesk.column.priority") },
    { name: "impact", label: t("helpdesk.column.impact") },
    { name: "device", label: t("helpdesk.column.device") },
    { name: "createdat", label: t("helpdesk.column.createdAt") },
    { name: "sla", label: t("helpdesk.column.sla") },
    { name: "approvers", label: t("helpdesk.column.approvers") },
  ];

  return (
    <PageMotion>
      <div className="w-full h-[calc(100vh-58px)] px-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 py-4">
          <Filter
            filters={filters}
            setFilters={(next: any) => {
              setFilters(next);
              setPage(1);
              presets.clearActive();
            }}
            filterOptions={filterOptions}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            onSavePreset={presets.savePreset}
          />
          <Search
            onChange={handleSearchChange}
            className="w-auto flex-1 min-w-[180px] max-w-[400px]"
          />
          <div className="flex items-center gap-2 ml-auto">
            <TableSettings
              settings={userSettings?.data}
              checkboxes={checkboxes}
              settingsKey="ticketsTableColumnOrder"
            />
            <button
              type="button"
              onClick={() => {
                setOnlyMine((v) => !v);
                setPage(1);
              }}
              disabled={!myId}
              className={`h-[36px] rounded-[6px] px-3 text-[13px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                onlyMine
                  ? "bg-[#2B9AE9] text-white"
                  : "bg-white text-[#3C3C3C] border border-[#D0D0D0]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={
                myId
                  ? t("helpdesk.toggleMine")
                  : t("helpdesk.currentUserUnknown")
              }
            >
              {t("helpdesk.myTickets")}
            </button>
          </div>
        </div>
        <FilterPresetsBar
          presets={presets.presets}
          activePresetId={presets.activePreset?.id ?? null}
          onActivate={presets.activatePreset}
          onDelete={presets.deletePreset}
        />
        <TicketsTable
          data={helpdeskQuery.data?.data ?? []}
          total={helpdeskQuery.data?.total ?? 0}
          onPageChange={setPage}
          onRowsPerPageChange={(newLimit: any) => {
            setLimit(newLimit);
            setPage(1);
          }}
          isLoading={helpdeskQuery.isFetching}
        />
      </div>
    </PageMotion>
  );
};

export default Index;
