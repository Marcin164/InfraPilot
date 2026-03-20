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

  const getTotal = () => {
    const totalDevices = usersByDepartment.reduce(
      (sum: number, d: any) => sum + d.value,
      0,
    );

    return totalDevices;
  };

  const getHighestDevicesDepartment = () => {
    const maxValue = Math.max(...usersByDepartment.map((d: any) => d.value));

    return usersByDepartment
      .filter((d: any) => d.value === maxValue)
      .map((d: any) => d.label)
      .join(", ");
  };

  const getLowestDevicesDepartment = () => {
    const minValue = Math.min(...usersByDepartment.map((d: any) => d.value));

    return usersByDepartment
      .filter((d: any) => d.value === minValue)
      .map((d: any) => d.label)
      .join(", ");
  };

  return (
    <ReportCard
      title="Users per Department"
      description="Department distribution"
      stats={[
        { label: "Departments", value: usersByDepartment.length },
        { label: "Largest", value: getHighestDevicesDepartment() },
        { label: "Smallest", value: getLowestDevicesDepartment() },
        { label: "Total", value: getTotal() },
      ]}
      onExport={() => exportCSV(usersByDepartment, "users_department")}
    >
      <ResponsiveContainer>
        <BarChart data={usersByDepartment}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <Tooltip cursor={false} />

          <Bar
            dataKey="value"
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
