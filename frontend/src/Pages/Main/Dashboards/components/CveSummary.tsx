import { useQuery } from "@tanstack/react-query";
import CardWrapper from "./CardWrapper";
import { cveSummary, CveSeverity } from "../../../../Services/cve";

const ORDER: CveSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];

const COLOR: Record<CveSeverity, string> = {
  CRITICAL: "#C0392B",
  HIGH: "#F3606E",
  MEDIUM: "#F1C40F",
  LOW: "#2B9AE9",
  UNKNOWN: "#8A8A8A",
};

const CveSummary = () => {
  const { data } = useQuery({
    queryKey: ["cve-summary"],
    queryFn: cveSummary,
  });

  const counts = data ?? {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNKNOWN: 0,
  };

  const total = ORDER.reduce((sum, k) => sum + (counts[k] ?? 0), 0);
  const critical = counts.CRITICAL ?? 0;

  const headlineColor =
    critical > 0
      ? COLOR.CRITICAL
      : (counts.HIGH ?? 0) > 0
        ? COLOR.HIGH
        : total > 0
          ? COLOR.MEDIUM
          : "#4CAF50";

  return (
    <CardWrapper
      title="Known vulnerabilities"
      subtitle="Distinct CVE × device pairs (OSV.dev)"
      accent={headlineColor}
    >
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="text-center">
          <div
            className="text-[44px] font-extrabold leading-none"
            style={{ color: headlineColor }}
          >
            {total}
          </div>
          <div className="text-[11px] text-[#8A8A8A]">
            exposures across fleet
          </div>
        </div>

        <div className="flex w-full rounded-full overflow-hidden h-[10px] bg-[#F0F0F0]">
          {ORDER.map((sev) => {
            const value = counts[sev] ?? 0;
            if (total === 0 || value === 0) return null;
            return (
              <div
                key={sev}
                title={`${sev}: ${value}`}
                style={{
                  backgroundColor: COLOR[sev],
                  width: `${(value / total) * 100}%`,
                }}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-[12px]">
          {ORDER.map((sev) => (
            <span key={sev} className="inline-flex items-center gap-1">
              <span
                className="inline-block w-[10px] h-[10px] rounded-full"
                style={{ backgroundColor: COLOR[sev] }}
              />
              <span className="font-bold" style={{ color: COLOR[sev] }}>
                {counts[sev] ?? 0}
              </span>
              <span className="text-[#8A8A8A]">{sev}</span>
            </span>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
};

export default CveSummary;
