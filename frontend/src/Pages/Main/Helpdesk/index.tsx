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
  console.log(authInfo?.accessToken);
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

  console.log(helpdeskQuery);

  const userSettings = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => {
      return getUserSettings();
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const checkboxes = [
    {
      name: "number",
      label: "Number",
    },
    {
      name: "assignee",
      label: "Assignee",
    },
    {
      name: "requester",
      label: "Requester",
    },
    {
      name: "assignmentgroup",
      label: "Assignment Group",
    },
    {
      name: "state",
      label: "State",
    },
    {
      name: "urgency",
      label: "Urgency",
    },
    {
      name: "priority",
      label: "Priority",
    },
    {
      name: "impact",
      label: "Impact",
    },
    {
      name: "device",
      label: "Device",
    },
    {
      name: "createdat",
      label: "Created At",
    },
    {
      name: "sla",
      label: "SLA",
    },
    {
      name: "approvers",
      label: "Approvers",
    },
  ];

  return (
    <PageMotion>
      <div className="w-full h-[calc(100vh-58px)] px-4">
        <div className="pt-4 pb-4 flex gap-2 items-center">
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
          <Search onChange={handleSearchChange} />
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
            className={`h-[36px] rounded-[6px] px-3 text-[13px] font-bold cursor-pointer transition-colors ${
              onlyMine
                ? "bg-[#2B9AE9] text-white"
                : "bg-white text-[#3C3C3C] border border-[#D0D0D0]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              myId ? "Toggle assignee = me filter" : "Current user unknown"
            }
          >
            My tickets
          </button>
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
