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

const IpamSubnetUtilization = () => {
  const { t } = useTranslation();
  const data = useDashboardData("ipam-subnet-utilization");

  return (
    <CardWrapper
      title={t("dashboard.widget.ipamSubnetUtilization")}
      subtitle={t("dashboard.widget.ipamSubnetUtilization.subtitle")}
      accent="#2BB3A3"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
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
              `${entry.payload.value}% (${entry.payload.used}/${entry.payload.total})`,
              "Used",
            ]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((item, i) => (
              <Cell key={i} fill={item.value >= 90 ? "#E74C3C" : "#2BB3A3"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardWrapper>
  );
};

export default IpamSubnetUtilization;
