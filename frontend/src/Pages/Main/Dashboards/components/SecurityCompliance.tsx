import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const SecurityCompliance = () => {
  const data = useDashboardData("security-patch-compliance");

  const compliant = data.find((d) => d.label.toLowerCase().includes("compliant") && !d.label.toLowerCase().includes("non"))?.value ?? 0;
  const nonCompliant = data.find((d) => d.label.toLowerCase().includes("non"))?.value ?? 0;
  const total = compliant + nonCompliant;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;

  const color = pct >= 80 ? "#2ECC71" : pct >= 50 ? "#F1C40F" : "#E74C3C";

  const chartData = [
    { value: compliant, color },
    { value: nonCompliant || (total === 0 ? 1 : 0), color: "#F0F0F0" },
  ];

  return (
    <CardWrapper title="Security Compliance" subtitle="Patch status" accent={color}>
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
            <span className="font-bold text-[#2ECC71]">{compliant}</span>{" "}
            <span className="text-[#8A8A8A]">patched</span>
          </span>
          <span>
            <span className="font-bold text-[#E74C3C]">{nonCompliant}</span>{" "}
            <span className="text-[#8A8A8A]">unpatched</span>
          </span>
        </div>
      </div>
    </CardWrapper>
  );
};

export default SecurityCompliance;
