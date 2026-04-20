import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const BitlockerCompliance = () => {
  const data = useDashboardData("security-outside-domain");

  const joined =
    data.find((d) => d.label.toLowerCase().includes("joined"))?.value ?? 0;
  const outside =
    data.find((d) => d.label.toLowerCase().includes("outside") || d.label.toLowerCase().includes("not"))?.value ?? 0;
  const total = joined + outside;
  const pct = total > 0 ? Math.round((joined / total) * 100) : 0;

  const color = pct >= 80 ? "#4CAF50" : pct >= 50 ? "#F1C40F" : "#F44336";

  const chartData = [
    { value: joined, color },
    { value: outside || (total === 0 ? 1 : 0), color: "#F0F0F0" },
  ];

  return (
    <CardWrapper title="Bitlocker Compliance" subtitle="Domain join status" accent={color}>
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
            <span className="font-bold" style={{ color }}>{joined}</span>{" "}
            <span className="text-[#8A8A8A]">joined</span>
          </span>
          <span>
            <span className="font-bold text-[#E74C3C]">{outside}</span>{" "}
            <span className="text-[#8A8A8A]">outside</span>
          </span>
        </div>
      </div>
    </CardWrapper>
  );
};

export default BitlockerCompliance;
