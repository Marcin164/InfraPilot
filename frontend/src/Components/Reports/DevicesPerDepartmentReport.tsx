import React from "react";
import ReportCard from "./ReportCard";
import { exportCSV } from "../../Helpers/files";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../Services/reports";

type Props = {};

// const devicesPerDepartment = [
//   { department: "IT", devices: 40 },
//   { department: "Finance", devices: 25 },
//   { department: "HR", devices: 15 },
//   { department: "Operations", devices: 35 },
//   { department: "Sales", devices: 30 },
// ];

const DevicesPerDepartmentReport = (props: Props) => {
  const { accessToken } = useAuthInfo();
  const devicesPerDepartmentQuery = useQuery({
    queryKey: ["reports", "devices-by-department"],
    queryFn: () => getReports(accessToken, "devices-by-department"),
  });

  const devicesPerDepartment: any = devicesPerDepartmentQuery?.data;

  if (!devicesPerDepartment) return null;

  const getTotal = () => {
    const totalDevices = devicesPerDepartment.reduce(
      (sum: number, d: any) => sum + d.value,
      0,
    );

    console.log(totalDevices);
    return totalDevices;
  };

  const getHighestDevicesDepartment = () => {
    const maxValue = Math.max(...devicesPerDepartment.map((d: any) => d.value));

    return devicesPerDepartment
      .filter((d: any) => d.value === maxValue)
      .map((d: any) => d.label)
      .join(", ");
  };

  const getLowestDevicesDepartment = () => {
    const minValue = Math.min(...devicesPerDepartment.map((d: any) => d.value));

    return devicesPerDepartment
      .filter((d: any) => d.value === minValue)
      .map((d: any) => d.label)
      .join(", ");
  };

  return (
    <ReportCard
      title="Devices per Department"
      description="Hardware allocation by department"
      stats={[
        { label: "Departments", value: devicesPerDepartment.length },
        { label: "Largest", value: getHighestDevicesDepartment() },
        { label: "Smallest", value: getLowestDevicesDepartment() },
        { label: "Total", value: getTotal() },
      ]}
      onExport={() => exportCSV(devicesPerDepartment, "devices_department")}
    >
      <ResponsiveContainer>
        <BarChart data={devicesPerDepartment}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <Tooltip cursor={false} />
          <Bar
            dataKey="value"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </ReportCard>
  );
};

export default DevicesPerDepartmentReport;
