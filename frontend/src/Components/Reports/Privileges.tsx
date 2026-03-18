import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import CardHeader from "../Headers/CardHeader";

type Data = {
  department: string;
  admins: number;
};

const data: Data[] = [
  { department: "IT", admins: 5 },
  { department: "HR", admins: 1 },
  { department: "Finance", admins: 2 },
  { department: "Operations", admins: 1 },
];

export default function AdminAccountsReport() {
  return (
    <div className="w-full h-[300px] overflow-y-auto bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <CardHeader text="Admin Accounts by Department" />

        <div className="w-[60%] h-[200px]">
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="department" />
              <Tooltip />
              <Bar dataKey="admins" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
