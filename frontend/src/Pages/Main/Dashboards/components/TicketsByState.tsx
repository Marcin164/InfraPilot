import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import CardWrapper from "./CardWrapper";
import { CHART_COLORS } from "../helpers";
import { useDashboardData } from "../DashboardDataContext";

const TicketsByState = () => {
  const data = useDashboardData("tickets-by-state");

  const items = data.map((d, i) => ({
    ...d,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const total = items.reduce((s, d) => s + d.value, 0);

  return (
    <CardWrapper title="Tickets by State" accent="#3498DB">
      <div className="flex h-full w-full items-center gap-2">
        <div className="relative h-full w-1/2 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                innerRadius="55%"
                outerRadius="85%"
                stroke="none"
                paddingAngle={2}
              >
                {items.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [v, ""]}
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-extrabold text-[#3C3C3C]">{total}</span>
            <span className="text-[10px] text-[#8A8A8A]">total</span>
          </div>
        </div>
        <div className="flex w-1/2 flex-col gap-1 overflow-y-auto pr-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px]">
              <div
                className="h-[10px] w-[10px] shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-[#3C3C3C]">{item.label}</span>
              <span className="ml-auto shrink-0 font-bold text-[#535353]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
};

export default TicketsByState;
