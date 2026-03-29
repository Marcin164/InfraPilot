import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ReportCard from "./ReportCard";
import { exportCSV } from "../../Helpers/files";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../Services/reports";

// const newUsers = [
//   { month: "Jan", users: 4 },
//   { month: "Feb", users: 8 },
//   { month: "Mar", users: 6 },
//   { month: "Apr", users: 9 },
//   { month: "May", users: 7 },
// ];

export default function NewUsersReport() {
  const newUsersQuery = useQuery({
    queryKey: ["reports", "users-new-over-time"],
    queryFn: () => getReports("users-new-over-time"),
  });

  const newUsers = newUsersQuery?.data;

  console.log(newUsers);

  if (!newUsers) return null;

  const getLastMonth = () => {
    if (!newUsers?.length) return 0;

    return newUsers[newUsers.length - 1].value;
  };

  const getPeakMonth = () => {
    if (!newUsers?.length) return "-";

    const peak = newUsers.reduce((max: any, item: any) =>
      item.value > max.value ? item : max,
    );

    return new Date(peak.label).toLocaleString("en-US", {
      month: "short",
    });
  };

  const getAverage = () => {
    if (!newUsers?.length) return 0;

    const sum = newUsers.reduce((acc: any, item: any) => acc + item.value, 0);

    return Math.round(sum / newUsers.length);
  };

  const getTrend = () => {
    if (!newUsers || newUsers.length < 2) return "Stable";

    const last = newUsers[newUsers.length - 1].value;
    const prev = newUsers[newUsers.length - 2].value;

    if (last > prev) return "Growing";
    if (last < prev) return "Declining";

    return "Stable";
  };
  return (
    <ReportCard
      title="New Users Over Time"
      description="User growth"
      stats={[
        { label: "Last Month", value: getLastMonth() },
        { label: "Peak", value: getPeakMonth() },
        { label: "Average", value: getAverage() },
        { label: "Trend", value: getTrend() },
      ]}
      onExport={() => exportCSV(newUsers, "new_users")}
    >
      <ResponsiveContainer>
        <LineChart data={newUsers}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <Tooltip cursor={false} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={3}
            isAnimationActive
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </ReportCard>
  );
}
