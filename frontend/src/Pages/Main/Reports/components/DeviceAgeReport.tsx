import React from "react";
import ReportCard from "./ReportCard";
import { exportCSV } from "../../../../Helpers/files";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../../../Services/reports";

type Props = {};

// const deviceAge = [
//   { age: "0-1 years", devices: 45 },
//   { age: "1-3 years", devices: 90 },
//   { age: "3-5 years", devices: 50 },
//   { age: "5+ years", devices: 20 },
// ];

const DeviceAgeReport = (props: Props) => {
  const deviceAgeQuery = useQuery({
    queryKey: ["reports", "device-age"],
    queryFn: () => getReports("device-age"),
  });

  const deviceAge = deviceAgeQuery?.data;

  console.log(deviceAge);

  if (!deviceAge) return null;
  return (
    <ReportCard
      title="Device Age"
      description="Hardware lifecycle overview"
      onExport={() => exportCSV(deviceAge, "device_age")}
    >
      <ResponsiveContainer>
        <BarChart data={deviceAge}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <Tooltip cursor={false} />
          <Bar
            dataKey="value"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DeviceAgeReport;
