import { Cell, Pie, PieChart } from "recharts";

type Props = {};

const Compliance = ({}: Props) => {
  const data = [
    { name: "Group A", value: 400, color: "#4CAF50" }, // zielony
    { name: "Group B", value: 300, color: "#F44336" }, // czerwony
  ];

  return (
    <div className="bg-white w-full h-full shadow-xl rounded-[10px]">
      <div className="text-[32px] font-semibold text-[#3C3C3C] text-center">
        Bitlocker compliance
      </div>
      <div className="relative h-[80%] flex items-center justify-center">
        <div className="absolute text-[40px] text-[#3C3C3C] font-bold">50%</div>
        <PieChart width={220} height={220}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </div>
    </div>
  );
};

export default Compliance;
