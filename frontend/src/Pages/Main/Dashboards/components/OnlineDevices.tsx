import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { getReports } from "../../../../Services/reports";

const OnlineDevices = () => {
  const { data } = useQuery({
    queryKey: ["report", "devices-online-offline"],
    queryFn: () => getReports("devices-online-offline"),
  });

  const online = (data ?? []).find((d) => d.label.toLowerCase() === "online")?.value ?? 0;
  const offline = (data ?? []).find((d) => d.label.toLowerCase() === "offline")?.value ?? 0;
  const total = online + offline;
  const pct = total > 0 ? Math.round((online / total) * 100) : 0;

  const chartData = [
    { name: "Online", value: online, color: "#2ECC71" },
    { name: "Offline", value: offline || 1, color: "#E0E0E0" },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center gap-4 px-4">
      <div className="relative h-[80px] w-[80px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius="70%"
              outerRadius="100%"
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
        <div className="absolute inset-0 flex items-center justify-center text-[18px] font-extrabold text-[#3C3C3C]">
          {pct}%
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[28px] font-extrabold leading-none text-[#2ECC71]">
          {online}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Devices Online</div>
        <div className="text-[11px] text-[#B0B0B0]">{offline} offline</div>
      </div>
    </div>
  );
};

export default OnlineDevices;
