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
import { CHART_COLORS } from "../helpers";
import { useDashboardData } from "../DashboardDataContext";

const DevicesByManufacturer = () => {
  const { t } = useTranslation();
  const data = useDashboardData("devices-by-manufacturer");

  const items = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <CardWrapper title={t("dashboard.widget.devicesByManufacturer")} accent="#1ABC9C">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#535353" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#8A8A8A" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
            formatter={(v: number) => [v, "Devices"]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
            {items.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
};

export default DevicesByManufacturer;
