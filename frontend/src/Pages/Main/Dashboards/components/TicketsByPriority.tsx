import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import CardWrapper from "./CardWrapper";
import { useDashboardData } from "../DashboardDataContext";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#2ECC71",
  medium: "#F1C40F",
  high: "#E67E22",
  critical: "#E74C3C",
};

const TicketsByPriority = () => {
  const { t } = useTranslation();
  const data = useDashboardData("tickets-by-priority");

  const items = data.map((d) => ({
    ...d,
    color: PRIORITY_COLORS[d.label.toLowerCase()] ?? "#636E72",
  }));

  const total = items.reduce((s, d) => s + d.value, 0);

  return (
    <CardWrapper title={t("dashboard.widget.ticketsByPriority")} accent="#E74C3C">
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
            <span className="text-[10px] text-[#8A8A8A]">tickets</span>
          </div>
        </div>
        <div className="flex w-1/2 flex-col gap-2 pr-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <div
                className="h-[10px] w-[10px] shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#3C3C3C]">{item.label}</span>
              <span className="ml-auto font-bold text-[#535353]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
};

export default TicketsByPriority;
