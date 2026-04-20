import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faDesktop,
  faTicket,
  faChartBar,
  faGear,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import Search from "../Inputs/Search";
import { globalSearch, type SearchResultItem } from "../../Services/search";

const STATIC_REPORTS: SearchResultItem[] = [
  { id: "r-users", type: "report", title: "Users report", url: "/admin/reports/users" },
  { id: "r-devices", type: "report", title: "Devices report", url: "/admin/reports/devices" },
  { id: "r-tickets", type: "report", title: "Tickets report", url: "/admin/reports/tickets" },
  { id: "r-security", type: "report", title: "Security report", url: "/admin/reports/security" },
];

const STATIC_SETTINGS: SearchResultItem[] = [
  { id: "s-personal", type: "setting", title: "Personal settings", url: "/admin/settings/personal" },
  { id: "s-ad", type: "setting", title: "Active Directory", url: "/admin/settings/active-directory" },
  { id: "s-sla", type: "setting", title: "SLA", url: "/admin/settings/sla" },
];

const ICONS: Record<SearchResultItem["type"], any> = {
  user: faUser,
  device: faDesktop,
  ticket: faTicket,
  history: faClockRotateLeft,
  report: faChartBar,
  setting: faGear,
};

const LABELS: Record<string, string> = {
  users: "Users",
  devices: "Devices",
  tickets: "Tickets",
  histories: "History",
  reports: "Reports",
  settings: "Settings",
};

const useDebounced = (value: string, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounced = useDebounced(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => globalSearch(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const staticMatches = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return { reports: [], settings: [] };
    return {
      reports: STATIC_REPORTS.filter((r) => r.title.toLowerCase().includes(q)),
      settings: STATIC_SETTINGS.filter((s) => s.title.toLowerCase().includes(q)),
    };
  }, [debounced]);

  const groups: { key: string; items: SearchResultItem[] }[] = [
    { key: "users", items: data?.users ?? [] },
    { key: "devices", items: data?.devices ?? [] },
    { key: "tickets", items: data?.tickets ?? [] },
    { key: "histories", items: data?.histories ?? [] },
    { key: "reports", items: staticMatches.reports },
    { key: "settings", items: staticMatches.settings },
  ];

  const totalCount = groups.reduce((acc, g) => acc + g.items.length, 0);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handlePick = (item: SearchResultItem) => {
    setOpen(false);
    setQuery("");
    navigate(item.url);
  };

  return (
    <div ref={containerRef} className="relative">
      <Search
        onChange={(e: any) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="border border-[#EFEFEF]"
      />
      {open && debounced.trim().length >= 2 && (
        <div className="absolute right-2 top-[40px] z-50 w-[400px] max-h-[480px] overflow-auto rounded-[10px] bg-white shadow-xl border border-[#EFEFEF]">
          {isFetching && totalCount === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Szukanie...</div>
          )}
          {!isFetching && totalCount === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Brak wyników</div>
          )}
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.key}>
                  <div className="px-4 py-1 text-[11px] font-semibold uppercase text-zinc-400 bg-zinc-50">
                    {LABELS[g.key]}
                  </div>
                  {g.items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handlePick(item)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-zinc-100"
                    >
                      <FontAwesomeIcon
                        icon={ICONS[item.type]}
                        className="text-[#2B9AE9] w-4"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-[#3C3C3C]">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="truncate text-xs text-zinc-500">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
