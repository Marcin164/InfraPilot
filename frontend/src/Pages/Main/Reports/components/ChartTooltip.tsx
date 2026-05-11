import React from "react";
import { useTranslation } from "react-i18next";
import type { ReportMeta } from "../../../../Services/reports";

// Recharts passes `active`, `payload`, and (for cartesian charts) `label`.
// Pie charts don't pass a `label` at the top level — the name lives inside
// payload[0].name / payload[0].payload.label.

type RechartsTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: any;
};

type Props = RechartsTooltipProps & {
  meta: ReportMeta;
  total?: number;
};

const ChartTooltip = ({ active, payload, label, meta, total }: Props) => {
  const { t } = useTranslation();
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const rawValue: number = Number(entry.value ?? 0);
  const rowLabel: string =
    label ?? entry.payload?.label ?? entry.name ?? "";

  const formatted = formatValue(rawValue, meta);
  const pct =
    total && total > 0 && !isPercentage(meta)
      ? ((rawValue / total) * 100).toFixed(1) + "%"
      : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 backdrop-blur px-3 py-2 shadow-lg text-sm min-w-[160px]">
      <div className="font-medium text-gray-800 break-words">
        {String(rowLabel) || "—"}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-gray-500">{valueLabel(meta, t)}</span>
        <span className="font-semibold text-gray-900">{formatted}</span>
      </div>
      {pct && (
        <div className="mt-0.5 flex items-center justify-between gap-3">
          <span className="text-gray-500">{t("reports.tooltip.share")}</span>
          <span className="text-gray-700">{pct}</span>
        </div>
      )}
      {entry.payload?.extra && (
        <div className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-500">
          {entry.payload.extra}
        </div>
      )}
    </div>
  );
};

// ────────── formatting helpers ──────────

function isPercentage(meta: ReportMeta): boolean {
  return (
    meta.key === "sla-compliance-rate" ||
    meta.key === "sla-performance-by-assignee"
  );
}

function isHours(meta: ReportMeta): boolean {
  return (
    meta.key === "tickets-resolution-time" ||
    meta.key === "sla-average-pause-time" ||
    meta.key === "sla-response-vs-resolution" ||
    meta.key === "tickets-approval-bottlenecks"
  );
}

function isDays(meta: ReportMeta): boolean {
  return meta.key === "histories-mean-time-between-assignments";
}

function isBytes(meta: ReportMeta): boolean {
  return meta.key === "applications-license-exposure";
}

function valueLabel(meta: ReportMeta, t: (k: string) => string): string {
  if (isPercentage(meta)) return t("reports.tooltip.compliance");
  if (isHours(meta)) return t("reports.tooltip.avgHours");
  if (isDays(meta)) return t("reports.tooltip.avgDays");
  if (isBytes(meta)) return t("reports.tooltip.totalSize");
  return t("reports.tooltip.count");
}

function formatValue(value: number, meta: ReportMeta): string {
  if (!Number.isFinite(value)) return "—";

  if (isPercentage(meta)) return `${value.toFixed(1)}%`;
  if (isHours(meta)) return formatHours(value);
  if (isDays(meta)) return `${value.toFixed(1)} d`;
  if (isBytes(meta)) return formatBytes(value);

  // default: integer with thousands separator
  return Math.round(value).toLocaleString();
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  const days = hours / 24;
  return `${days.toFixed(1)} d`;
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 2 : 0)} ${units[i]}`;
}

export default ChartTooltip;
