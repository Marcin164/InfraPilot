import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import moment from "moment";
import {
  faClockRotateLeft,
  faPlus,
  faMinus,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import {
  listDeviceScans,
  diffDeviceScans,
  ScanListItem,
} from "../../../../Services/devices";

const SECTION_ICONS: Record<string, string> = {
  system: "🖥",
  hardware: "⚙",
  software: "📦",
  network: "🌐",
  security: "🔒",
  peripherals: "🖱",
  users: "👥",
  eventLogs: "📜",
};

const truncate = (v: any, n = 80) => {
  const s = v === null || v === undefined ? "∅" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > n ? s.slice(0, n) + "…" : s;
};

const Scans = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const deviceId = device?.data?.id;

  const scansQuery = useQuery({
    queryKey: ["device-scans", deviceId],
    queryFn: () => listDeviceScans(deviceId),
    enabled: Boolean(deviceId),
  });

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);

  useEffect(() => {
    const scans = scansQuery.data ?? [];
    if (scans.length >= 2 && !fromId && !toId) {
      setToId(scans[0].id);
      setFromId(scans[1].id);
    }
  }, [scansQuery.data]);

  const diffQuery = useQuery({
    queryKey: ["device-scan-diff", deviceId, fromId, toId],
    queryFn: () => diffDeviceScans(deviceId, fromId!, toId!),
    enabled: Boolean(deviceId && fromId && toId),
  });

  const scans = scansQuery.data ?? [];
  const diff = diffQuery.data;

  const pickScan = (scan: ScanListItem) => {
    if (!toId || scan.id === toId) {
      setToId(scan.id);
      return;
    }
    if (scan.id === fromId) {
      setFromId(null);
      return;
    }
    setFromId(toId);
    setToId(scan.id);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("device.section.scanHistory")} icon={faClockRotateLeft} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          Every agent scan produces an immutable snapshot. Pick any two to
          compare — the most recent pair is selected by default.
        </p>

        {scans.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            No scans yet for this device.
          </div>
        ) : (
          <div className="mt-3 max-h-[320px] overflow-y-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[#7a7a7a] text-[11px] uppercase">
                  <th className="py-1 w-[40px]" />
                  <th className="py-1">Received</th>
                  <th className="py-1">Snapshot SHA256</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => {
                  const isFrom = scan.id === fromId;
                  const isTo = scan.id === toId;
                  return (
                    <tr
                      key={scan.id}
                      onClick={() => pickScan(scan)}
                      className={`cursor-pointer hover:bg-[#F5F5F5] ${
                        isFrom || isTo ? "bg-[#E8F4FD]" : ""
                      }`}
                    >
                      <td className="py-1 pl-1">
                        {isFrom && (
                          <span className="text-[10px] font-bold text-[#2B9AE9]">
                            FROM
                          </span>
                        )}
                        {isTo && (
                          <span className="text-[10px] font-bold text-[#30A712]">
                            TO
                          </span>
                        )}
                      </td>
                      <td className="py-1">
                        {moment(scan.receivedAt).format(
                          "DD.MM.YYYY HH:mm:ss",
                        )}
                      </td>
                      <td className="py-1 font-mono text-[11px] text-[#535353]">
                        {scan.snapshotSha256.slice(0, 16)}…
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {diff && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <CardHeader text={t("device.section.diff")} icon={faRotate} />
          <div className="mt-2 text-[12px] text-[#7a7a7a]">
            {moment(diff.from.receivedAt).format("DD.MM.YYYY HH:mm:ss")} →{" "}
            {moment(diff.to.receivedAt).format("DD.MM.YYYY HH:mm:ss")}
          </div>

          {diff.changedSections.length === 0 ? (
            <div className="mt-3 rounded-[8px] border border-[#DFF0D8] bg-[#F6FBF1] p-3 text-[13px]">
              No changes between these two scans.
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {diff.changedSections.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-[#E8F4FD] text-[#2B9AE9] text-[12px] font-bold px-3 py-0.5"
                >
                  {SECTION_ICONS[s] ?? ""} {s}
                </span>
              ))}
            </div>
          )}

          {/* Software diff — most useful */}
          {(diff.software.added.length > 0 ||
            diff.software.removed.length > 0 ||
            diff.software.versionChanged.length > 0) && (
            <div className="mt-5">
              <div className="text-[14px] font-bold text-[#3C3C3C] mb-2">
                Software
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-[8px] border border-[#DFF0D8] bg-[#F6FBF1] p-3">
                  <div className="text-[12px] font-bold text-[#30A712] mb-1">
                    <FontAwesomeIcon icon={faPlus} /> Installed (
                    {diff.software.added.length})
                  </div>
                  {diff.software.added.length === 0 ? (
                    <div className="text-[12px] text-[#7a7a7a]">—</div>
                  ) : (
                    <ul className="text-[12px] space-y-1">
                      {diff.software.added.slice(0, 30).map((s, i) => (
                        <li key={i}>
                          {s.name}{" "}
                          {s.version && (
                            <span className="text-[#7a7a7a]">v{s.version}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-[8px] border border-[#F3D3D7] bg-[#FDF5F6] p-3">
                  <div className="text-[12px] font-bold text-[#F3606E] mb-1">
                    <FontAwesomeIcon icon={faMinus} /> Removed (
                    {diff.software.removed.length})
                  </div>
                  {diff.software.removed.length === 0 ? (
                    <div className="text-[12px] text-[#7a7a7a]">—</div>
                  ) : (
                    <ul className="text-[12px] space-y-1">
                      {diff.software.removed.slice(0, 30).map((s, i) => (
                        <li key={i}>
                          {s.name}{" "}
                          {s.version && (
                            <span className="text-[#7a7a7a]">v{s.version}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-[8px] border border-[#FCEFCC] bg-[#FFFBEF] p-3">
                  <div className="text-[12px] font-bold text-[#F1C40F] mb-1">
                    <FontAwesomeIcon icon={faRotate} /> Version change (
                    {diff.software.versionChanged.length})
                  </div>
                  {diff.software.versionChanged.length === 0 ? (
                    <div className="text-[12px] text-[#7a7a7a]">—</div>
                  ) : (
                    <ul className="text-[12px] space-y-1">
                      {diff.software.versionChanged.slice(0, 30).map((s, i) => (
                        <li key={i}>
                          {s.name}:{" "}
                          <span className="text-[#7a7a7a]">
                            {s.from ?? "—"} → {s.to ?? "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Field-level diffs (non-software) */}
          {diff.fieldChanges.filter((f) => f.section !== "software").length > 0 && (
            <div className="mt-5">
              <div className="text-[14px] font-bold text-[#3C3C3C] mb-2">
                Field-level changes
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[#7a7a7a] text-[11px] uppercase">
                    <th className="py-1">Section</th>
                    <th className="py-1">Path</th>
                    <th className="py-1">Before</th>
                    <th className="py-1">After</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.fieldChanges
                    .filter((f) => f.section !== "software")
                    .slice(0, 100)
                    .map((f, i) => (
                      <tr key={i} className="border-t border-[#F0F0F0]">
                        <td className="py-1 pr-2">{f.section}</td>
                        <td className="py-1 pr-2 font-mono text-[11px]">
                          {f.path}
                        </td>
                        <td className="py-1 pr-2 text-[#F3606E] font-mono">
                          {truncate(f.before)}
                        </td>
                        <td className="py-1 text-[#30A712] font-mono">
                          {truncate(f.after)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scans;
