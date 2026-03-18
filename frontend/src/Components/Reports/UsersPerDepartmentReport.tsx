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
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../Services/reports";
import { useAuthInfo } from "@propelauth/react";

type Props = {};

// const usersPerDepartment = [
//   { department: "IT", users: 34 },
//   { department: "Finance", users: 21 },
//   { department: "HR", users: 11 },
//   { department: "Operations", users: 28 },
//   { department: "Sales", users: 45 },
// ];

const UsersPerDepartmentReport = (props: Props) => {
  const { accessToken } = useAuthInfo();
  const usersPerDepartmentQuery = useQuery({
    queryKey: ["reports", "users-by-department"],
    queryFn: () => getReports(accessToken, "users-by-department"),
  });

  const usersByDepartment = usersPerDepartmentQuery?.data;

  if (!usersByDepartment) return null;
  return (
    <ReportCard
      title="Users per Department"
      description="Department distribution"
      stats={[
        { label: "Departments", value: 5 },
        { label: "Largest", value: "Sales" },
        { label: "Smallest", value: "HR" },
        { label: "Total", value: 139 },
      ]}
      onExport={() => exportCSV(usersByDepartment, "users_department")}
    >
      <ResponsiveContainer>
        <BarChart data={usersByDepartment}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <Tooltip cursor={false} />

          <Bar
            dataKey="users"
            fill="#a855f7"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default UsersPerDepartmentReport;
