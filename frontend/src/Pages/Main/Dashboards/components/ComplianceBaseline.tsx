import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import CardWrapper from "./CardWrapper";
import { complianceSummary } from "../../../../Services/compliance";

const ComplianceBaseline = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-summary"],
    queryFn: complianceSummary,
  });

  const totalDevices = data?.totalDevices ?? 0;
  const compliantDevices = data?.compliantDevices ?? 0;
  const pct = data?.compliancePct ?? (isLoading ? 0 : 100);

  const color = pct >= 90 ? "#4CAF50" : pct >= 70 ? "#F1C40F" : "#F44336";

  const chartData = [
    { value: compliantDevices, color },
    {
      value: Math.max(totalDevices - compliantDevices, 0) || (totalDevices === 0 ? 1 : 0),
      color: "#F0F0F0",
    },
  ];

  const severities = data?.bySeverity ?? {};
  const critical = severities.CRITICAL?.devices ?? 0;
  const high = severities.HIGH?.devices ?? 0;

  return (
    <CardWrapper
      title={t("dashboard.widget.complianceBaseline")}
      subtitle={t("dashboard.widget.complianceBaseline.subtitle")}
      accent={color}
    >
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
            <span
              className="text-[38px] font-extrabold leading-none"
              style={{ color }}
            >
              {pct}%
            </span>
            <span className="text-[11px] text-[#8A8A8A]">compliant</span>
          </div>
        </div>
        <div className="flex gap-6 text-[13px]">
          <span>
            <span className="font-bold" style={{ color }}>
              {compliantDevices}
            </span>{" "}
            <span className="text-[#8A8A8A]">clean</span>
          </span>
          <span>
            <span className="font-bold text-[#C0392B]">{critical}</span>{" "}
            <span className="text-[#8A8A8A]">critical</span>
          </span>
          <span>
            <span className="font-bold text-[#F3606E]">{high}</span>{" "}
            <span className="text-[#8A8A8A]">high</span>
          </span>
        </div>
      </div>
    </CardWrapper>
  );
};

export default ComplianceBaseline;
