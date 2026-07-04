import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReportsBatch } from "../../../Services/reports";
import type { ReportDataPoint } from "../../../Types";

const ALL_REPORT_KEYS = [
  "users-by-department",
  "users-inactive",
  "devices-by-manufacturer",
  "devices-by-os",
  "devices-online-offline",
  "tickets-by-state",
  "tickets-by-priority",
  "tickets-over-time",
  "security-patch-compliance",
  "security-outside-domain",
  "applications-top-installed",
  "audit-activity-over-time",
  "licenses-expiring-soon",
  "licenses-seat-utilization",
  "ipam-conflicts",
  "ipam-subnet-utilization",
  "fleet-stale-agents",
  "network-backup-status",
  "retention-legal-hold",
  "procurement-pipeline",
];

type DashboardData = Record<string, ReportDataPoint[]>;

const DashboardDataContext = createContext<DashboardData>({});

export const useDashboardData = (reportKey: string): ReportDataPoint[] => {
  const data = useContext(DashboardDataContext);
  return data[reportKey] ?? [];
};

export const DashboardDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { data } = useQuery({
    queryKey: ["dashboard-reports-batch"],
    queryFn: () => getReportsBatch(ALL_REPORT_KEYS),
    staleTime: 60_000,
  });

  const value = useMemo(() => data ?? {}, [data]);

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
};
