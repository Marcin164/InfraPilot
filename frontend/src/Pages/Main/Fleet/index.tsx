import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import moment from "moment";
import {
  faBug,
  faComputer,
  faGaugeHigh,
  faHourglassHalf,
  faPlus,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PageMotion from "../../../Components/PageMotion/PageMotion";
import DataLoader from "../../../Components/Loaders/DataLoader";
import CardHeader from "../../../Components/Headers/CardHeader";
import { fleetOverview, staleAgents } from "../../../Services/fleet";

const LIFECYCLE_COLOR: Record<string, string> = {
  procurement: "#8A8A8A",
  active: "#30A712",
  in_repair: "#F1C40F",
  in_storage: "#2B9AE9",
  retired: "#8E44AD",
  disposed: "#7F8C8D",
  lost: "#F3606E",
};

const CVE_COLOR: Record<string, string> = {
  CRITICAL: "#C0392B",
  HIGH: "#F3606E",
  MEDIUM: "#F1C40F",
  LOW: "#2B9AE9",
  UNKNOWN: "#8A8A8A",
};

const Kpi = ({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  icon: any;
}) => (
  <div className="bg-white rounded-[10px] shadow p-4 flex-1 min-w-[180px]">
    <div className="flex items-center gap-2 text-[13px] text-[#7a7a7a]">
      <FontAwesomeIcon icon={icon} />
      {label}
    </div>
    <div
      className="text-[32px] font-extrabold mt-1 leading-none"
      style={color ? { color } : undefined}
    >
      {value}
    </div>
    {sub && <div className="text-[12px] text-[#8a8a8a] mt-1">{sub}</div>}
  </div>
);

const FleetHealth = () => {
  const overview = useQuery({
    queryKey: ["fleet-overview"],
    queryFn: fleetOverview,
    refetchInterval: 60000,
  });

  const stale = useQuery({
    queryKey: ["fleet-stale"],
    queryFn: () => staleAgents(),
  });

  if (overview.isLoading) return <DataLoader />;
  if (!overview.data) return null;
  const o = overview.data;

  const pctColor =
    o.compliance.compliancePct >= 90
      ? "#4CAF50"
      : o.compliance.compliancePct >= 70
        ? "#F1C40F"
        : "#F44336";

  const critical = o.cves.CRITICAL ?? 0;
  const high = o.cves.HIGH ?? 0;
  const totalCves = Object.values(o.cves).reduce((a, b) => a + b, 0);

  return (
    <PageMotion>
      <div className="w-full p-4 space-y-4">
        <h1 className="text-[22px] font-bold text-[#3C3C3C] flex items-center gap-2">
          <FontAwesomeIcon icon={faGaugeHigh} />
          Fleet health
        </h1>
        <div className="text-[12px] text-[#8a8a8a]">
          Refreshed every minute · last update{" "}
          {moment(o.generatedAt).format("HH:mm:ss")}
        </div>

        {/* KPI row */}
        <div className="flex flex-wrap gap-4">
          <Kpi
            label="Total devices"
            value={o.totalDevices}
            sub={`${o.activeDevices} active`}
            icon={faComputer}
          />
          <Kpi
            label="Compliance"
            value={`${o.compliance.compliancePct}%`}
            sub={`${o.compliance.compliantDevices} of ${o.compliance.totalDevices} clean`}
            color={pctColor}
            icon={faShieldHalved}
          />
          <Kpi
            label="Stale agents"
            value={o.staleAgents}
            sub={`no scan in ${o.staleAgentsThresholdHours}h`}
            color={o.staleAgents > 0 ? "#F3606E" : "#30A712"}
            icon={faHourglassHalf}
          />
          <Kpi
            label="New in last 7 days"
            value={o.newInLastWeek}
            icon={faPlus}
          />
          <Kpi
            label="CVE exposures"
            value={totalCves}
            sub={`${critical} critical · ${high} high`}
            color={
              critical > 0 ? CVE_COLOR.CRITICAL : high > 0 ? CVE_COLOR.HIGH : undefined
            }
            icon={faBug}
          />
        </div>

        {/* Lifecycle breakdown */}
        <div className="bg-white rounded-[10px] shadow p-4">
          <CardHeader text="Lifecycle breakdown" icon={faComputer} />
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(o.lifecycle).map(([state, count]) => (
              <div
                key={state}
                className="flex items-center gap-2 rounded-full border border-[#E0E0E0] px-3 py-1 text-[13px]"
              >
                <span
                  className="w-[10px] h-[10px] rounded-full"
                  style={{
                    backgroundColor: LIFECYCLE_COLOR[state] ?? "#8A8A8A",
                  }}
                />
                <span className="text-[#3C3C3C]">
                  {state.replace("_", " ")}
                </span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CVE severity breakdown */}
        <div className="bg-white rounded-[10px] shadow p-4">
          <CardHeader text="CVE severity breakdown" icon={faBug} />
          <div className="mt-3 flex flex-wrap gap-2">
            {["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"].map((sev) => (
              <div
                key={sev}
                className="flex items-center gap-2 rounded-full border border-[#E0E0E0] px-3 py-1 text-[13px]"
              >
                <span
                  className="w-[10px] h-[10px] rounded-full"
                  style={{ backgroundColor: CVE_COLOR[sev] }}
                />
                <span className="text-[#3C3C3C]">{sev}</span>
                <span className="font-bold">{o.cves[sev] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stale agents table */}
        <div className="bg-white rounded-[10px] shadow p-4">
          <CardHeader text="Stale agents" icon={faHourglassHalf} />
          {stale.isLoading ? (
            <div className="text-[13px] text-[#7a7a7a] mt-3">Loading…</div>
          ) : (stale.data ?? []).length === 0 ? (
            <div className="text-[13px] text-[#7a7a7a] mt-3">
              Every active device has reported recently.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-[#F0F0F0]">
              {(stale.data ?? []).slice(0, 20).map((d) => (
                <Link
                  key={d.id}
                  to={`/admin/devices/${d.id}/system`}
                  className="flex items-center justify-between py-2 hover:bg-[#FAFAFA] rounded px-2"
                >
                  <div>
                    <div className="font-bold text-[13px] text-[#3C3C3C]">
                      {d.assetName ?? `${d.manufacturer ?? ""} ${d.model ?? ""}`}
                    </div>
                    <div className="text-[11px] text-[#8a8a8a]">
                      SN: {d.serialNumber ?? "—"} ·{" "}
                      {d.user
                        ? `${d.user.name} ${d.user.surname}`
                        : "unassigned"}
                    </div>
                  </div>
                  <div className="text-[12px] text-[#F3606E] font-bold">
                    {d.lastScanAt
                      ? `${moment(d.lastScanAt).fromNow()}`
                      : "never"}
                  </div>
                </Link>
              ))}
              {(stale.data ?? []).length > 20 && (
                <div className="text-[12px] text-[#8a8a8a] pt-2">
                  … and {stale.data!.length - 20} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageMotion>
  );
};

export default FleetHealth;
