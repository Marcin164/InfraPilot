import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import CardWrapper from "./CardWrapper";
import { getAgentStats } from "../../../../Services/tickets";

const AgentSlaQuality = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["agent-stats"],
    queryFn: getAgentStats,
    refetchInterval: 60000,
  });

  const pct = data?.slaCompliancePct ?? null;
  const mttr = data?.avgMttrHours;

  const color =
    pct === null
      ? "#8A8A8A"
      : pct >= 95
        ? "#4CAF50"
        : pct >= 80
          ? "#F1C40F"
          : "#F44336";

  const chart =
    pct === null
      ? [{ value: 1, color: "#F0F0F0" }]
      : [
          { value: pct, color },
          { value: Math.max(100 - pct, 0), color: "#F0F0F0" },
        ];

  const mttrLabel =
    mttr === null || mttr === undefined
      ? "—"
      : mttr < 24
        ? `${mttr}h`
        : `${(mttr / 24).toFixed(1)}d`;

  return (
    <CardWrapper
      title={t("dashboard.widget.agentSlaQuality")}
      subtitle={t("dashboard.widget.agentSlaQuality.subtitle")}
      accent={color}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-[140px] w-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart}
                dataKey="value"
                innerRadius="68%"
                outerRadius="95%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {chart.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[34px] font-extrabold leading-none"
              style={{ color }}
            >
              {pct === null ? "—" : `${pct}%`}
            </span>
            <span className="text-[11px] text-[#8A8A8A]">no breaches</span>
          </div>
        </div>
        <div className="text-[12px] text-[#7a7a7a]">
          Avg MTTR: <span className="font-bold text-[#3C3C3C]">{mttrLabel}</span>
        </div>
      </div>
    </CardWrapper>
  );
};

export default AgentSlaQuality;
