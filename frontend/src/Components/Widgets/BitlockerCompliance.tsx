import { Cell, Pie, PieChart } from "recharts";

type Props = {};

const Compliance = ({}: Props) => {
  const data = [
    { name: "Group A", value: 400, color: "#4CAF50" }, // zielony
    { name: "Group B", value: 300, color: "#F44336" }, // czerwony
  ];

  return (
    <div className="bg-white w-full h-full shadow-xl rounded-[10px] px-4 ">
      <div className="text-[32px] font-semibold text-[#3C3C3C] py-2">
        Bitlocker compliance
      </div>
      <div className="relative flex items-center justify-center">
        <div className="absolute text-[40px] text-[#3C3C3C] font-bold">50%</div>
        <PieChart width={200} height={200}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
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
