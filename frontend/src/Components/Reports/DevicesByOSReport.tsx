import React from "react";
import ReportCard from "./ReportCard";
import { exportCSV } from "../../Helpers/files";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { pieColors } from "../../Constants/charts";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../Services/reports";

type Props = {};

const DevicesByOSReport = (props: Props) => {
  const { accessToken } = useAuthInfo();
  const devicesByOSQuery = useQuery({
    queryKey: ["reports", "devices-by-os"],
    queryFn: () => getReports(accessToken, "devices-by-os"),
  });

  const devicesByOS: any = devicesByOSQuery?.data;

  if (!devicesByOS) return null;

  return (
    <ReportCard
      title="Devices by Operating System"
      description="Operating system distribution"
      onExport={() => exportCSV(devicesByOS, "devices_os")}
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={devicesByOS} dataKey="value" outerRadius={160}>
            {devicesByOS.map((entry: any, index: any) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DevicesByOSReport;
