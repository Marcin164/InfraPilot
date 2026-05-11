import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { toast } from "react-toastify";

import {
  getHistoryFeed,
  exportHistoryFeedCsv,
} from "../../../Services/histories";
import { getUser } from "../../../Services/users";
import type { HistoryEntry, HistoryType } from "../../../Types";
import HistoryFilters, {
  HistoryFiltersState,
} from "./components/HistoryFilters";
import HistoryFeedItem from "./components/HistoryFeedItem";
import PageMotion from "../../../Components/PageMotion/PageMotion";

const PAGE_SIZE = 30;

const parseTypes = (raw: string | null): HistoryType[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => parseInt(t, 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 4) as HistoryType[];
};

const serializeTypes = (types: HistoryType[]) =>
  types.length ? types.join(",") : "";

const formatDayHeader = (
  date: string,
  t: (k: string) => string,
): string => {
  const m = moment(date, "YYYY-MM-DD", true);
  if (!m.isValid()) return date;
  const today = moment().startOf("day");
  const diff = today.diff(m.startOf("day"), "days");
  if (diff === 0) return t("history.today");
  if (diff === 1) return t("history.yesterday");
  return m.format("DD MMMM YYYY");
};

const emptyFilters: HistoryFiltersState = {
  types: [],
  from: "",
  to: "",
  q: "",
  deviceId: undefined,
  userId: undefined,
};

const History = () => {
  const { t } = useTranslation();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const hasAccess =
    currentUserQuery.data?.isAdmin === true ||
    currentUserQuery.data?.isApprover === true;

  const [searchParams, setSearchParams] = useSearchParams();

  const filters: HistoryFiltersState = useMemo(
    () => ({
      types: parseTypes(searchParams.get("types")),
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      q: searchParams.get("q") ?? "",
      deviceId: searchParams.get("deviceId") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
    }),
    [searchParams],
  );

  const updateFilters = (next: HistoryFiltersState) => {
    const params = new URLSearchParams();
    const typesStr = serializeTypes(next.types);
    if (typesStr) params.set("types", typesStr);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    if (next.q) params.set("q", next.q);
    if (next.deviceId) params.set("deviceId", next.deviceId);
    if (next.userId) params.set("userId", next.userId);
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => updateFilters(emptyFilters);

  const feedQuery = useInfiniteQuery({
    queryKey: ["history-feed", filters],
    queryFn: ({ pageParam }) =>
      getHistoryFeed(
        pageParam as string | null,
        {
          types: filters.types,
          from: filters.from || undefined,
          to: filters.to || undefined,
          q: filters.q || undefined,
          deviceId: filters.deviceId,
          userId: filters.userId,
        },
        PAGE_SIZE,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: hasAccess,
  });

  const entries = useMemo<HistoryEntry[]>(() => {
    if (!feedQuery.data) return [];
    return feedQuery.data.pages.flatMap((page) => page.data);
  }, [feedQuery.data]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of entries) {
      const key = entry.date || "unknown";
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [entries]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!feedQuery.hasNextPage || feedQuery.isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (observed) => {
        if (observed[0]?.isIntersecting) {
          feedQuery.fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [feedQuery.hasNextPage, feedQuery.isFetchingNextPage, entries.length]);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportHistoryFeedCsv({
        types: filters.types,
        from: filters.from || undefined,
        to: filters.to || undefined,
        q: filters.q || undefined,
        deviceId: filters.deviceId,
        userId: filters.userId,
      });
      toast.success(t("toast.success.csvExported"));
    } catch {
      toast.error(t("toast.error.csvExport"));
    } finally {
      setExporting(false);
    }
  };

  if (currentUserQuery.isLoading) {
    return <div className="p-6 text-[#535353]">{t("history.loading")}</div>;
  }

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-[600px] p-6">
        <div className="rounded-[10px] bg-white p-6 shadow-xl">
          <div className="text-[24px] font-bold text-[#BC0E0E]">
            {t("history.accessDenied")}
          </div>
          <div className="pt-2 text-[#535353]">
            {t("history.accessHelp")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageMotion>
    <div className="flex flex-col gap-4 p-2">
      <HistoryFilters
        value={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        onExport={handleExport}
        exporting={exporting}
      />

      {feedQuery.isLoading && (
        <div className="rounded-[10px] bg-white p-6 text-center text-[#535353] shadow-xl">
          {t("history.loadingFeed")}
        </div>
      )}

      {feedQuery.isError && (
        <div className="rounded-[10px] bg-white p-6 text-center text-[#BC0E0E] shadow-xl">
          {t("history.loadFailed")}
        </div>
      )}

      {!feedQuery.isLoading && entries.length === 0 && !feedQuery.isError && (
        <div className="rounded-[10px] bg-white p-6 text-center text-[#535353] shadow-xl">
          {t("history.noEntries")}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {groups.map(([day, dayEntries]) => (
          <div key={day} className="flex flex-col gap-3">
            <div className="sticky top-0 z-10 -mx-2 bg-[#F5F7FA] px-2 py-1">
              <span className="text-[16px] font-bold text-[#3C3C3C]">
                {formatDayHeader(day, t)}
              </span>
              <span className="pl-2 text-[13px] text-[#8A8A8A]">
                {t("history.entries", { count: dayEntries.length })}
              </span>
            </div>
            {dayEntries.map((entry) => (
              <HistoryFeedItem key={entry.id} entry={entry} />
            ))}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-[1px]" />

      {feedQuery.isFetchingNextPage && (
        <div className="py-2 text-center text-[#535353]">{t("history.loadingMore")}</div>
      )}

      {!feedQuery.hasNextPage && entries.length > 0 && (
        <div className="py-4 text-center text-[13px] text-[#8A8A8A]">
          {t("history.end")}
        </div>
      )}
    </div>
    </PageMotion>
  );
};

export default History;
