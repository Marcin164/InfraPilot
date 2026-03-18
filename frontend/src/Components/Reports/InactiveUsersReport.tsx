import React from "react";
import ReportCard from "./ReportCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { exportCSV } from "../../Helpers/files";

type Props = {};

const inactiveUsers = [
  { period: "30 days", users: 6 },
  { period: "60 days", users: 4 },
  { period: "90 days", users: 11 },
];

const InactiveUsersReport = (props: Props) => {
  return (
    <ReportCard
      title="Inactive Users"
      description="Accounts without activity"
      stats={[
        { label: "30 Days", value: 6 },
        { label: "60 Days", value: 4 },
        { label: "90 Days", value: 11 },
        { label: "Total", value: 21 },
      ]}
      onExport={() => exportCSV(inactiveUsers, "inactive_users")}
    >
      <ResponsiveContainer>
        <BarChart data={inactiveUsers}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />

          <Tooltip cursor={false} />

          <Bar
            dataKey="users"
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

export default InactiveUsersReport;
