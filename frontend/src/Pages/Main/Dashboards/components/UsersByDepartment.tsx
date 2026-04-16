import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getReports } from "../../../../Services/reports";
import CardWrapper from "./CardWrapper";
import { CHART_COLORS } from "../helpers";

const UsersByDepartment = () => {
  const { data } = useQuery({
    queryKey: ["report", "users-by-department"],
    queryFn: () => getReports("users-by-department"),
  });

  const items = (data ?? [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <CardWrapper title="Users by Department" accent="#2B9AE9">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fontSize: 11, fill: "#535353" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
            formatter={(v: number) => [v, "Users"]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
            {items.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
};

export default UsersByDepartment;
