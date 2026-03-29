import React from "react";
import ReportCard from "./ReportCard";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { exportCSV } from "../../../../Helpers/files";
import { pieColors } from "../../../../Constants/charts";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../../../Services/reports";

type Props = {};

const UsersWithoutDevicesReport = (props: Props) => {
  const usersWithoutDevicesQuery = useQuery({
    queryKey: ["reports", "users-without-device"],
    queryFn: () => getReports("users-without-device"),
  });

  const usersWithoutDevices: any = usersWithoutDevicesQuery?.data;

  console.log(usersWithoutDevices);

  if (!usersWithoutDevices) return null;
  return (
    <ReportCard
      title="Devices per Users"
      description="Device allocation overview"
      onExport={() => exportCSV(usersWithoutDevices, "device_allocation")}
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip cursor={false} />
          <Legend />
          <Pie
            data={usersWithoutDevices}
            dataKey="value"
            outerRadius={160}
            isAnimationActive
            animationDuration={900}
          >
            {usersWithoutDevices.map((entry: any, index: any) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default UsersWithoutDevicesReport;
