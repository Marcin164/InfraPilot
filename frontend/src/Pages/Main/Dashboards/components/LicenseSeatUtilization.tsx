import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const LicenseSeatUtilization = () => {
  const { t } = useTranslation();
  const data = useDashboardData("licenses-seat-utilization");

  const items = data.map((d) => ({
    ...d,
    total: Number(d.total) || 0,
    pct: Number(d.total) > 0 ? Math.round((d.value / Number(d.total)) * 100) : 0,
  }));

  return (
    <CardWrapper
      title={t("dashboard.widget.licenseSeatUtilization")}
      subtitle={t("dashboard.widget.licenseSeatUtilization.subtitle")}
      accent="#E8A33D"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} hide />
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
            formatter={(_: number, __: string, entry: any) => [
              `${entry.payload.value} / ${entry.payload.total}`,
              "Seats",
            ]}
          />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={16}>
            {items.map((item, i) => (
              <Cell key={i} fill={item.pct >= 90 ? "#E74C3C" : "#E8A33D"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
};

export default LicenseSeatUtilization;
