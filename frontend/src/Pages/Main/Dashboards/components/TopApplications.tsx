import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import CardWrapper from "./CardWrapper";
import { CHART_COLORS } from "../helpers";
import { useDashboardData } from "../DashboardDataContext";

const TopApplications = () => {
  const data = useDashboardData("applications-top-installed");

  const items = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <CardWrapper title="Top Applications" subtitle="Most installed" accent="#6C5CE7">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fontSize: 11, fill: "#535353" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
            formatter={(v: number) => [v, "Installs"]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
            {items.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
};

export default TopApplications;
