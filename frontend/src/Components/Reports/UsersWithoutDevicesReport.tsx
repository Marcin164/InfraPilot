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
import { exportCSV } from "../../Helpers/files";
import { pieColors } from "../../Constants/charts";

type Props = {};

const usersWithoutDevices = [
  { name: "With Device", value: 182 },
  { name: "Without Device", value: 18 },
];

const UsersWithoutDevicesReport = (props: Props) => {
  return (
    <ReportCard
      title="Users Without Devices"
      description="Device allocation overview"
      stats={[
        { label: "Total Users", value: 200 },
        { label: "With Device", value: 182 },
        { label: "Without", value: 18 },
        { label: "Coverage", value: "91%" },
      ]}
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
            {usersWithoutDevices.map((entry, index) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default UsersWithoutDevicesReport;
