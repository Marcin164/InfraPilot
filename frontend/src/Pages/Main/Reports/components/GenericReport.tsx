import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportCard from "./ReportCard";
import ReportFilters, { type ReportFilterValues } from "./ReportFilters";
import ChartTooltip from "./ChartTooltip";
import { pieColors } from "../../../../Constants/charts";
import {
  getReports,
  reportExportUrl,
  type ReportMeta,
} from "../../../../Services/reports";
import { exportCSV } from "../../../../Helpers/files";
import api from "../../../../lib/api";

type Props = {
  meta: ReportMeta;
  filters?: ReportFilterValues;
};

const GenericReport = ({ meta, filters: initialFilters }: Props) => {
  const [filters, setFilters] = useState<ReportFilterValues>(
    initialFilters ?? {}
  );

  const hasFilters = (meta.supportsFilters?.length ?? 0) > 0;
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", meta.key, activeFilters],
    queryFn: () => getReports(meta.key, activeFilters),
  });

  const rows: any[] = Array.isArray(data) ? data : [];

  const handleExport = async () => {
    try {
      const res = await api.get(reportExportUrl(meta.key, activeFilters), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.key}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      exportCSV(rows, meta.key);
    }
  };

  return (
    <ReportCard
      title={meta.title}
      description={meta.description}
      onExport={handleExport}
    >
      <div className="flex flex-col h-full">
        {hasFilters && (
          <ReportFilters
            supports={meta.supportsFilters!}
            values={filters}
            onChange={setFilters}
          />
        )}
        <div className="flex-1 min-h-0">
          {isLoading && <div className="text-gray-400">Loading…</div>}
          {error && (
            <div className="text-red-500">Failed to load report</div>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <div className="text-gray-400">No data</div>
          )}
          {!isLoading && rows.length > 0 && renderChart(meta, rows)}
        </div>
      </div>
    </ReportCard>
  );
};

function renderChart(meta: ReportMeta, rows: any[]) {
  const data = rows.map((r) => ({
    label: r.label ?? r.name ?? "",
    value: Number(r.value) || 0,
    ...r,
  }));
  const total = data.reduce((acc, r) => acc + (Number(r.value) || 0), 0);
  const tooltip = (
    <Tooltip
      content={<ChartTooltip meta={meta} total={total} />}
      cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
    />
  );

  if (meta.chart === "pie") {
    return (
      <ResponsiveContainer>
        <PieChart>
          {tooltip}
          <Legend />
          <Pie data={data} dataKey="value" nameKey="label" outerRadius={160}>
            {data.map((_, i) => (
              <Cell key={i} fill={pieColors[i % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (meta.chart === "line") {
    return (
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          {tooltip}
          <Line
            type="monotone"
            dataKey="value"
            stroke={pieColors[0]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (meta.chart === "table") {
    return (
      <div className="overflow-auto h-full">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2">Label</th>
              <th className="text-right p-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{row.label}</td>
                <td className="p-2 text-right">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        {tooltip}
        <Bar dataKey="value" fill={pieColors[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GenericReport;
