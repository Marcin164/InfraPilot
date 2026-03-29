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
import { getReports } from "../../Services/reports";
import { useQuery } from "@tanstack/react-query";

type Props = {};

const DevicesByTypeReport = (props: Props) => {
  const devicesByTypeQuery = useQuery({
    queryKey: ["reports", "devices-by-type"],
    queryFn: () => getReports("devices-by-type"),
  });

  const devicesByType: any = devicesByTypeQuery?.data;
  console.log(devicesByType);

  if (!devicesByType) return null;

  const getTotalDevices = () => {
    return devicesByType.reduce((sum: any, d: any) => sum + d.value, 0);
  };

  const getMostCommon = () => {
    if (!devicesByType?.length) return [];

    const max = Math.max(...devicesByType.map((d: any) => d.value));

    return devicesByType
      .filter((d: any) => d.value === max)
      .map((d: any) => d.label);
  };

  const getServersCount = () => {
    const server = devicesByType.find((d: any) => d.label === "Server");
    return server ? server.value : 0;
  };

  const MOBILE_TYPES = ["Phone", "Tablet"];

  const getMobilesCount = () => {
    return devicesByType
      .filter((d: any) => MOBILE_TYPES.includes(d.label))
      .reduce((sum: any, d: any) => sum + d.value, 0);
  };

  return (
    <ReportCard
      title="Devices by Type"
      description="Distribution of hardware types"
      stats={[
        { label: "Total Devices", value: getTotalDevices() },
        { label: "Most Common", value: getMostCommon() },
        { label: "Servers", value: getServersCount() },
        { label: "Mobile", value: getMobilesCount() },
      ]}
      onExport={() => exportCSV(devicesByType, "devices_by_type")}
    >
      <ResponsiveContainer>
        <BarChart data={devicesByType}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <Tooltip cursor={false} />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DevicesByTypeReport;
