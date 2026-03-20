import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import CardHeader from "../Headers/CardHeader";
import ReportCard from "./ReportCard";
import CustomTooltip from "./CustomTooltip";
import { exportCSV } from "../../Helpers/files";
import { getReports } from "../../Services/reports";
import { useQuery } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";

type Data = {
  department: string;
  admins: number;
};

// const adminAccounts = [
//   { department: "IT", admins: 8 },
//   { department: "Finance", admins: 2 },
//   { department: "HR", admins: 1 },
//   { department: "Operations", admins: 3 },
//   { department: "Sales", admins: 2 },
// ];

export default function AdminAccountsReport() {
  const { accessToken } = useAuthInfo();
  const adminAccountsQuery = useQuery({
    queryKey: ["reports", "users-with-admin"],
    queryFn: () => getReports(accessToken, "users-with-admin"),
  });

  const adminAccounts: any = adminAccountsQuery?.data;

  console.log(adminAccounts);

  if (!adminAccounts) return null;

  const getTotalAdmins = () => {
    const admins = adminAccounts.filter(
      (admin: any) => admin.label !== "Non-Admins",
    );
    return admins.reduce((sum: any, d: any) => sum + Number(d.value), 0);
  };

  const getHighestDevicesDepartment = () => {
    const maxValue = Math.max(...adminAccounts.map((d: any) => d.value));

    return adminAccounts
      .filter((d: any) => d.value === maxValue)
      .map((d: any) => d.label)
      .join(", ");
  };

  const getLowestDevicesDepartment = () => {
    const minValue = Math.min(...adminAccounts.map((d: any) => d.value));

    return adminAccounts
      .filter((d: any) => d.value === minValue)
      .map((d: any) => d.label)
      .join(", ");
  };

  return (
    <ReportCard
      title="Administrative Accounts"
      description="Users with elevated privileges"
      stats={[
        { label: "Total Admins", value: getTotalAdmins() },
        { label: "Departments", value: adminAccounts.length },
        { label: "Highest", value: getHighestDevicesDepartment() },
        { label: "Lowest", value: getLowestDevicesDepartment() },
      ]}
      onExport={() => exportCSV(adminAccounts, "admin_accounts")}
    >
      <ResponsiveContainer>
        <BarChart data={adminAccounts}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <Tooltip cursor={false} />

          <Bar
            dataKey="value"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
            // onClick={(d) => onDrill(d.department)}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}
