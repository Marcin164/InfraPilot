import { useQuery } from "@tanstack/react-query";
import CardWrapper from "./CardWrapper";
import { getAgentStats } from "../../../../Services/tickets";

const AgentScoreboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-stats"],
    queryFn: getAgentStats,
    refetchInterval: 60000,
  });

  const open = data?.openAssigned ?? 0;
  const resolvedToday = data?.resolvedToday ?? 0;
  const resolvedWeek = data?.resolvedThisWeek ?? 0;
  const breaching = data?.breachingToday ?? 0;

  const breachColor = breaching > 0 ? "#F3606E" : "#30A712";

  return (
    <CardWrapper
      title="My ticket scoreboard"
      subtitle="Live agent metrics"
      accent="#2B9AE9"
    >
      <div className="grid grid-cols-2 gap-3 w-full">
        <Cell label="Open" value={open} color="#2B9AE9" loading={isLoading} />
        <Cell
          label="Breaching today"
          value={breaching}
          color={breachColor}
          loading={isLoading}
        />
        <Cell
          label="Resolved today"
          value={resolvedToday}
          color="#30A712"
          loading={isLoading}
        />
        <Cell
          label="Resolved this week"
          value={resolvedWeek}
          color="#16A085"
          loading={isLoading}
        />
      </div>
    </CardWrapper>
  );
};

const Cell = ({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  loading?: boolean;
}) => (
  <div className="rounded-[8px] border border-[#F0F0F0] px-3 py-2">
    <div className="text-[11px] text-[#7a7a7a]">{label}</div>
    <div
      className="text-[26px] font-extrabold leading-none mt-1"
      style={{ color }}
    >
      {loading ? "—" : value}
    </div>
  </div>
);

export default AgentScoreboard;
