import React from "react";
import ReportCard from "./ReportCard";
import {
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Bar,
} from "recharts";
import { exportCSV } from "../../Helpers/files";

type Props = {};

const multiDevices = [
  { user: "Anna", devices: 3 },
  { user: "John", devices: 4 },
  { user: "Kate", devices: 2 },
  { user: "Mark", devices: 3 },
];

const MultiDeviceUsersReport = (props: Props) => {
  return (
    <ReportCard
      title="Users With Multiple Devices"
      description="Users assigned multiple devices"
      stats={[
        { label: "Users", value: 4 },
        { label: "Max Devices", value: 4 },
        { label: "Average", value: 3 },
        { label: "Risk", value: "Medium" },
      ]}
      onExport={() => exportCSV(multiDevices, "multi_devices")}
    >
      <ResponsiveContainer>
        <BarChart data={multiDevices}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="user" />
          <Tooltip cursor={false} />

          <Bar
            dataKey="devices"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default MultiDeviceUsersReport;
