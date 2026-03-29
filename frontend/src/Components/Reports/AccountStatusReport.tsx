import React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ReportCard from "./ReportCard";
import { pieColors } from "../../Constants/charts";
import { exportCSV } from "../../Helpers/files";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../Services/reports";

type Props = {};

const accountStatus = [
  { name: "Active", value: 170 },
  { name: "Blocked", value: 12 },
  { name: "Expired", value: 8 },
];

const AccountStatusReport = (props: Props) => {
  const usersPerDepartmentQuery = useQuery({
    queryKey: ["reports", "users-by-department"],
    queryFn: () => getReports("users-by-department"),
  });

  const usersByDepartment = usersPerDepartmentQuery?.data;

  if (!usersByDepartment) return null;
  return (
    <ReportCard
      title="Account Status"
      description="Active vs blocked vs expired"
      stats={[
        { label: "Active", value: 170 },
        { label: "Blocked", value: 12 },
        { label: "Expired", value: 8 },
        { label: "Total", value: 190 },
      ]}
      onExport={() => exportCSV(accountStatus, "account_status")}
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip cursor={false} />
          <Legend />

          <Pie
            data={accountStatus}
            dataKey="value"
            outerRadius={160}
            isAnimationActive
            animationDuration={900}
          >
            {accountStatus.map((entry, index) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default AccountStatusReport;
