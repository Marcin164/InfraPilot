import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTranslation } from "react-i18next";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const LastScan = () => {
  const { t } = useTranslation();
  const data = useDashboardData("audit-activity-over-time");

  const items = data.map((d) => ({
    label: d.label,
    value: d.value,
  }));

  return (
    <CardWrapper title={t("dashboard.widget.lastScan")} subtitle={t("dashboard.widget.lastScan.subtitle")} accent="#9B59B6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={items} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9B59B6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#9B59B6" stopOpacity={0} />
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
            formatter={(v: number) => [v, "Events"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#9B59B6"
            strokeWidth={2.5}
            fill="url(#scanGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
};

export default LastScan;
