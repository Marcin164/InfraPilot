import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const BitlockerCompliance = () => {
  const { t } = useTranslation();
  const data = useDashboardData("security-bitlocker-compliance");

  const enabled =
    data.find((d) => d.label.toLowerCase().includes("enabled"))?.value ?? 0;
  const disabled =
    data.find((d) => d.label.toLowerCase().includes("disabled"))?.value ?? 0;
  const total = enabled + disabled;
  const pct = total > 0 ? Math.round((enabled / total) * 100) : 0;

  const color = pct >= 80 ? "#4CAF50" : pct >= 50 ? "#F1C40F" : "#F44336";

  const chartData = [
    { value: enabled, color },
    { value: disabled || (total === 0 ? 1 : 0), color: "#F0F0F0" },
  ];

  return (
    <CardWrapper title={t("dashboard.widget.bitlockerCompliance")} subtitle={t("dashboard.widget.bitlockerCompliance.subtitle")} accent={color}>
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-[150px] w-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius="68%"
                outerRadius="95%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {chartData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[38px] font-extrabold leading-none" style={{ color }}>
              {pct}%
            </span>
            <span className="text-[11px] text-[#8A8A8A]">compliant</span>
          </div>
        </div>
        <div className="flex gap-6 text-[13px]">
          <span>
            <span className="font-bold" style={{ color }}>{enabled}</span>{" "}
            <span className="text-[#8A8A8A]">enabled</span>
          </span>
          <span>
            <span className="font-bold text-[#E74C3C]">{disabled}</span>{" "}
            <span className="text-[#8A8A8A]">disabled</span>
          </span>
        </div>
      </div>
    </CardWrapper>
  );
};

export default BitlockerCompliance;
