import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import moment from "moment";
import {
  faBug,
  faBoxArchive,
  faClock,
  faPlay,
  faShield,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getDevice,
  listDeviceScans,
  diffDeviceScans,
} from "../../../../Services/devices";
import { complianceForDevice } from "../../../../Services/compliance";
import { cvesForDevice } from "../../../../Services/cve";

const LIFECYCLE_COLOR: Record<string, string> = {
  procurement: "#8A8A8A",
  active: "#30A712",
  in_repair: "#F1C40F",
  in_storage: "#2B9AE9",
  retired: "#8E44AD",
  disposed: "#7F8C8D",
  lost: "#F3606E",
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#C0392B",
  HIGH: "#F3606E",
  MEDIUM: "#F1C40F",
  LOW: "#2B9AE9",
  UNKNOWN: "#8A8A8A",
};

type Props = { deviceId: string | null | undefined };

/**
 * At-a-glance device facts inside the ticket detail — so the agent does
 * not have to navigate away to judge whether the machine is online, what
 * policy it violates, and what changed recently.
 */
const DeviceContextPanel = ({ deviceId }: Props) => {
  const enabled = Boolean(deviceId);

  const deviceQuery = useQuery({
    queryKey: ["device-ctx", deviceId],
    queryFn: () => getDevice(deviceId!),
    enabled,
  });

  const complianceQuery = useQuery({
    queryKey: ["device-ctx-compliance", deviceId],
    queryFn: () => complianceForDevice(deviceId!),
    enabled,
  });

  const cvesQuery = useQuery({
    queryKey: ["device-ctx-cves", deviceId],
    queryFn: () => cvesForDevice(deviceId!),
    enabled,
  });

  const scansQuery = useQuery({
    queryKey: ["device-ctx-scans", deviceId],
    queryFn: () => listDeviceScans(deviceId!, 5),
    enabled,
  });

  const diffQuery = useQuery({
    queryKey: ["device-ctx-diff", deviceId],
    queryFn: () => diffDeviceScans(deviceId!),
    enabled,
  });

  if (!deviceId) {
    return (
      <div className="bg-[#FAFAFA] border border-dashed border-[#E0E0E0] rounded-[8px] p-3 mt-3 text-[12px] text-[#7a7a7a]">
        No device attached to this ticket.
      </div>
    );
  }

  if (deviceQuery.isLoading) {
    return (
      <div className="bg-[#FAFAFA] rounded-[8px] p-3 mt-3 text-[12px] text-[#7a7a7a]">
        Loading device context…
      </div>
    );
  }

  const device: any = deviceQuery.data;
  if (!device) return null;

  const compliance = complianceQuery.data ?? [];
  const failing = compliance.filter((r: any) => !r.passed);
  const compliancePct =
    compliance.length === 0
      ? null
      : Math.round(
          ((compliance.length - failing.length) / compliance.length) * 100,
        );
  const pctColor =
    compliancePct === null
      ? "#8A8A8A"
      : compliancePct === 100
        ? "#30A712"
        : compliancePct >= 80
          ? "#F1C40F"
          : "#F3606E";

  const cves = cvesQuery.data ?? [];
  const criticalCves = cves.filter((c: any) => c.severity === "CRITICAL").length;
  const highCves = cves.filter((c: any) => c.severity === "HIGH").length;

  const lifecycle = device.lifecycle ?? "active";
  const staleHours = device.lastScanAt
    ? (Date.now() - new Date(device.lastScanAt).getTime()) / 3600000
    : Infinity;
  const staleColor =
    staleHours > 168 ? "#F3606E" : staleHours > 72 ? "#F1C40F" : "#30A712";

  const diff = diffQuery.data;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: LIFECYCLE_COLOR[lifecycle] ?? "#8A8A8A" }}
        >
          <FontAwesomeIcon icon={faBoxArchive} className="mr-1" />
          {lifecycle.replace("_", " ")}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ color: staleColor, border: `1px solid ${staleColor}` }}
        >
          <FontAwesomeIcon icon={faClock} className="mr-1" />
          {device.lastScanAt
            ? `scan ${moment(device.lastScanAt).fromNow()}`
            : "never scanned"}
        </span>
        {compliancePct !== null && (
          <Link
            to={`/admin/devices/${device.id}/compliance`}
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ color: pctColor, border: `1px solid ${pctColor}` }}
            title={
              failing.length > 0
                ? `Failing: ${failing.map((r: any) => r.rule?.name ?? r.ruleKey).join(", ")}`
                : "All rules passing"
            }
          >
            <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />
            {compliancePct}% compliant
          </Link>
        )}
        {cves.length > 0 && (
          <Link
            to={`/admin/devices/${device.id}/cves`}
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{
              backgroundColor:
                criticalCves > 0
                  ? SEVERITY_COLOR.CRITICAL
                  : highCves > 0
                    ? SEVERITY_COLOR.HIGH
                    : SEVERITY_COLOR.MEDIUM,
            }}
          >
            <FontAwesomeIcon icon={faBug} className="mr-1" />
            {cves.length} CVE{criticalCves > 0 ? ` (${criticalCves} crit)` : ""}
          </Link>
        )}
      </div>

      {failing.length > 0 && (
        <div className="rounded-[6px] border border-[#F3D3D7] bg-[#FDF5F6] px-2 py-1 text-[11px]">
          <FontAwesomeIcon icon={faShield} className="text-[#C0392B] mr-1" />
          <span className="font-bold text-[#C0392B]">Failing:</span>{" "}
          {failing
            .slice(0, 3)
            .map((r: any) => r.rule?.name ?? r.ruleKey)
            .join(" · ")}
          {failing.length > 3 && ` +${failing.length - 3} more`}
        </div>
      )}

      {diff && diff.changedSections && diff.changedSections.length > 0 && (
        <div className="rounded-[6px] border border-[#E0E0E0] bg-[#FAFAFA] px-2 py-1 text-[11px]">
          <FontAwesomeIcon icon={faPlay} className="text-[#2B9AE9] mr-1" />
          <span className="font-bold">Recent change</span> (
          {moment(diff.to.receivedAt).fromNow()}):{" "}
          {diff.changedSections.join(", ")}
          {diff.software.added.length > 0 && (
            <> · <span className="text-[#30A712]">+{diff.software.added.length} app</span></>
          )}
          {diff.software.removed.length > 0 && (
            <> · <span className="text-[#F3606E]">−{diff.software.removed.length} app</span></>
          )}
          {diff.software.versionChanged.length > 0 && (
            <>
              {" "}
              ·{" "}
              <span className="text-[#F1C40F]">
                ~{diff.software.versionChanged.length} ver
              </span>
            </>
          )}
        </div>
      )}

      {scansQuery.data && scansQuery.data.length > 0 && (
        <Link
          to={`/admin/devices/${device.id}/scans`}
          className="block text-[11px] text-[#2B9AE9] hover:underline"
        >
          View scan history ({scansQuery.data.length} recent) →
        </Link>
      )}
    </div>
  );
};

export default DeviceContextPanel;
