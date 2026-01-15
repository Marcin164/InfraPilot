import React, { useState } from "react";
import Filter from "../../../Components/Filter";
import Search from "../../../Components/Inputs/Search";
import { useTranslation } from "react-i18next";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import TableSettings from "../../../Components/TableSettings";
import { getTickets } from "../../../Services/tickets";
import { buildQuery } from "../../../Helpers/queries";
import { useDebounce } from "../../../Hooks/useDebounce";
import TicketsTable from "../../../Components/Tables/TicketsTable";

type TicketFilters = {
  type?: string[];
  priority?: string[];
  impact?: string[];
  urgency?: string[];
};

const Index = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { accessToken } = useAuthInfo();
  const [limit, setLimit] = useState(30);
  const [isOpen, setIsOpen] = useState(false);

  const [filterOptions] = useState({
    type: ["Incident", "Service"],
    priority: ["Low", "Medium", "High", "Critical"],
    impact: ["Single user", "Multiple users", "Whole company"],
    urgency: ["Low", "Medium", "High"],
  });

  const [filters, setFilters] = useState<TicketFilters>({});

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);

  const queryString = buildQuery({
    ...filters,
    search: debouncedSearch,
    page,
    limit,
  });

  const helpdeskQuery = useQuery({
    queryKey: ["helpdesk", filters, debouncedSearch, page, limit],
    queryFn: () => getTickets(accessToken, queryString),
    placeholderData: (prev) => prev,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className="w-full h-[calc(100vh-58px)] px-4">
      <div className="pt-4 pb-4 flex gap-2">
        <Filter
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
        <Search onChange={handleSearchChange} />
        <TableSettings />
      </div>
      <TicketsTable
        data={helpdeskQuery.data?.data ?? []}
        total={helpdeskQuery.data?.total ?? 0}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onRowsPerPageChange={(newLimit: any) => {
          setLimit(newLimit);
          setPage(1);
        }}
        isLoading={helpdeskQuery.isFetching}
      />
    </div>
  );
};

export default Index;
