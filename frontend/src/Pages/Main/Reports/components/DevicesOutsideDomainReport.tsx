import ReportCard from "./ReportCard";
import { exportCSV } from "../../../../Helpers/files";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { pieColors } from "../../../../Constants/charts";

type Props = {};

const devicesOutsideDomain = [
  { name: "Domain Joined", value: 180 },
  { name: "Outside Domain", value: 12 },
];

const DevicesOutsideDomainReport = (props: Props) => {
  return (
    <ReportCard
      title="Devices Outside Domain"
      description="Systems not joined to directory"
      stats={[
        { label: "Joined", value: 180 },
        { label: "Outside", value: 12 },
        { label: "Compliance", value: "94%" },
        { label: "Risk", value: "Medium" },
      ]}
      onExport={() => exportCSV(devicesOutsideDomain, "devices_outside_domain")}
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={devicesOutsideDomain} dataKey="value" outerRadius={160}>
            {devicesOutsideDomain.map((entry, index) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DevicesOutsideDomainReport;
