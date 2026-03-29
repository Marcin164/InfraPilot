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
  YAxis,
} from "recharts";

type Props = {};

const usersLocalAdmin = [
  { department: "IT", users: 8 },
  { department: "Finance", users: 2 },
  { department: "HR", users: 1 },
  { department: "Operations", users: 3 },
];

const LocalAdminUsersReport = (props: Props) => {
  return (
    <ReportCard
      title="Users With Local Admin Rights"
      description="Potential privilege escalation risk"
      stats={[
        { label: "Total", value: 14 },
        { label: "Departments", value: 4 },
        { label: "Highest", value: "IT" },
        { label: "Audit Risk", value: "High" },
      ]}
      onExport={() => exportCSV(usersLocalAdmin, "local_admin_users")}
    >
      <ResponsiveContainer>
        <BarChart data={usersLocalAdmin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis />
          <Tooltip cursor={false} />
          <Bar
            dataKey="users"
            fill="#f97316"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default LocalAdminUsersReport;
