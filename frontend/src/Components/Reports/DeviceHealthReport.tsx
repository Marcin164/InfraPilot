import React from "react";
import ReportCard from "./ReportCard";
import { exportCSV } from "../../Helpers/files";
import { pieColors } from "../../Constants/charts";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Props = {};

const deviceHealth = [
  { name: "Healthy", value: 140 },
  { name: "Needs Update", value: 30 },
  { name: "Outdated", value: 15 },
  { name: "Broken", value: 5 },
];

const DeviceHealthReport = (props: Props) => {
  return (
    <ReportCard
      title="Device Health"
      description="Update and maintenance status"
      stats={[
        { label: "Healthy", value: 140 },
        { label: "Updates", value: 30 },
        { label: "Outdated", value: 15 },
        { label: "Broken", value: 5 },
      ]}
      onExport={() => exportCSV(deviceHealth, "device_health")}
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={deviceHealth} dataKey="value" outerRadius={160}>
            {deviceHealth.map((entry, index) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DeviceHealthReport;
