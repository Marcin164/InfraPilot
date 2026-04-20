import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const TicketsOverTime = () => {
  const data = useDashboardData("tickets-over-time");

  const items = data.map((d) => ({
    label: d.label,
    value: d.value,
  }));

  return (
    <CardWrapper title="Tickets Over Time" subtitle="Trend" accent="#E67E22">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={items} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="ticketsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2B9AE9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2B9AE9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#8A8A8A" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#8A8A8A" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
            formatter={(v: number) => [v, "Tickets"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2B9AE9"
            strokeWidth={2.5}
            fill="url(#ticketsGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
};

export default TicketsOverTime;
