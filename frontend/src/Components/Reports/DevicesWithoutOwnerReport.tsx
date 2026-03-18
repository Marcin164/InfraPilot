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

const DevicesWithoutOwnerReport = (props: Props) => {
  const { accessToken } = useAuthInfo();
  const reportsQuery = useQuery({
    queryKey: ["reports", "devices-without-owner"],
    queryFn: () => getReports(accessToken, "devices-without-owner"),
  });

  const devicesWithoutOwner = reportsQuery?.data;

  if (!devicesWithoutOwner) {
    return null;
  }

  console.log(devicesWithoutOwner);
  return (
    <ReportCard
      title="Devices Without Assigned User"
      description="Hardware assets missing ownership"
      stats={[
        { label: "Assigned", value: 165 },
        { label: "Unassigned", value: 20 },
        { label: "Inventory", value: 185 },
        { label: "Audit", value: "Attention" },
      ]}
      onExport={() => exportCSV(devicesWithoutOwner, "devices_without_owner")}
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={devicesWithoutOwner} dataKey="value" outerRadius={160}>
            {devicesWithoutOwner.map((entry: any, index: any) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DevicesWithoutOwnerReport;
