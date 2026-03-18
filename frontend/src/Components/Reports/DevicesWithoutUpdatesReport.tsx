import React from "react";
import ReportCard from "./ReportCard";
import { exportCSV } from "../../Helpers/files";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../Services/reports";

type Props = {};

const DevicesWithoutUpdatesReport = (props: Props) => {
  const { accessToken } = useAuthInfo();
  const reportsQuery = useQuery({
    queryKey: ["reports", "devices-without-updates"],
    queryFn: () => getReports(accessToken, "devices-without-updates"),
  });

  const devicesWithoutUpdatesByType = reportsQuery?.data;

  if (!devicesWithoutUpdatesByType) return null;

  return (
    <ReportCard
      title="Devices Missing Updates"
      description="Systems that are not fully patched"
      stats={[
        { label: "Total", value: 185 },
        { label: "Up to Date", value: 150 },
        { label: "Missing", value: 35 },
        { label: "Compliance", value: "81%" },
      ]}
      onExport={() =>
        exportCSV(devicesWithoutUpdatesByType, "devices_missing_updates")
      }
    >
      <ResponsiveContainer>
        <BarChart data={devicesWithoutUpdatesByType}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <Tooltip cursor={false} />
          <Bar
            dataKey="value"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DevicesWithoutUpdatesReport;
