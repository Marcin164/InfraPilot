import React from "react";
import ReportCard from "./ReportCard";
import { pieColors } from "../../Constants/charts";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { exportCSV } from "../../Helpers/files";

type Props = {};

const devicesWithoutAV = [
  { name: "Protected", value: 170 },
  { name: "No Antivirus", value: 15 },
];

const DevicesWithoutAVReport = (props: Props) => {
  return (
    <ReportCard
      title="Devices Without Antivirus"
      description="Endpoint protection coverage"
      stats={[
        { label: "Protected", value: 170 },
        { label: "No AV", value: 15 },
        { label: "Coverage", value: "92%" },
        { label: "Risk", value: "Medium" },
      ]}
      onExport={() => exportCSV(devicesWithoutAV, "devices_without_antivirus")}
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={devicesWithoutAV} dataKey="value" outerRadius={160}>
            {devicesWithoutAV.map((entry, index) => (
              <Cell key={index} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DevicesWithoutAVReport;
