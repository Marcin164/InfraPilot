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

const newUsers = [
  { month: "Jan", users: 4 },
  { month: "Feb", users: 8 },
  { month: "Mar", users: 6 },
  { month: "Apr", users: 9 },
  { month: "May", users: 7 },
];

export default function NewUsersReport() {
  return (
    <ReportCard
      title="New Users Over Time"
      description="User growth"
      stats={[
        { label: "Last Month", value: 7 },
        { label: "Peak", value: "Apr" },
        { label: "Average", value: 6 },
        { label: "Trend", value: "Growing" },
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
          <XAxis dataKey="month" />
          <Tooltip cursor={false} />

          <Line
            type="monotone"
            dataKey="users"
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
