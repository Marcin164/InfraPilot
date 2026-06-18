import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import moment from "moment";
import { faBug } from "@fortawesome/free-solid-svg-icons";

import CardHeader from "../../../../Components/Headers/CardHeader";
import { cvesForDevice, DeviceCve } from "../../../../Services/cve";

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#C0392B",
  HIGH: "#F3606E",
  MEDIUM: "#F1C40F",
  LOW: "#2B9AE9",
  UNKNOWN: "#8A8A8A",
};

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];

const Cves = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const deviceId = device?.data?.id;

  const cvesQuery = useQuery({
    queryKey: ["cves-device", deviceId],
    queryFn: () => cvesForDevice(deviceId),
    enabled: Boolean(deviceId),
  });

  const cves = cvesQuery.data ?? [];
  const grouped = SEVERITY_ORDER.map((sev) => ({
    severity: sev,
    items: cves.filter((c: DeviceCve) => c.severity === sev),
  })).filter((g) => g.items.length > 0);

  const totalCounts = SEVERITY_ORDER.reduce(
    (acc, sev) => ({
      ...acc,
      [sev]: cves.filter((c) => c.severity === sev).length,
    }),
    {} as Record<string, number>,
  );

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("device.section.cves")} icon={faBug} />

      <p className="text-[12px] text-[#7a7a7a] mt-2">
        {t("device.cves.help")}
      </p>

      {cves.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-[#DFF0D8] bg-[#F6FBF1] p-3 text-[13px] text-[#3C3C3C]">
          {t("device.cves.none")}
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEVERITY_ORDER.map((sev) =>
              totalCounts[sev] > 0 ? (
                <span
                  key={sev}
                  className="rounded-full px-3 py-1 text-[12px] font-bold text-white"
                  style={{ backgroundColor: SEVERITY_COLOR[sev] }}
                >
                  {sev}: {totalCounts[sev]}
                </span>
              ) : null,
            )}
          </div>

          <div className="mt-4 space-y-4">
            {grouped.map((group) => (
              <div key={group.severity}>
                <div className="text-[13px] font-bold text-[#3C3C3C] mb-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                    style={{ backgroundColor: SEVERITY_COLOR[group.severity] }}
                  />
                  {group.severity}
                </div>
                <div className="space-y-2">
                  {group.items.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-[8px] border border-[#E0E0E0] px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <a
                            href={`https://osv.dev/vulnerability/${c.cveId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#2B9AE9] hover:underline"
                          >
                            {c.cveId}
                          </a>
                          <span className="text-[13px] text-[#3C3C3C]">
                            {c.applicationName}{" "}
                            {c.version && (
                              <span className="text-[#7a7a7a]">
                                (v{c.version})
                              </span>
                            )}
                          </span>
                        </div>
                        {c.publishedAt && (
                          <span className="text-[11px] text-[#9a9a9a]">
                            {t("device.cves.published")}{" "}
                            {moment(c.publishedAt).format("DD.MM.YYYY")}
                          </span>
                        )}
                      </div>
                      {c.summary && (
                        <p className="mt-1 text-[12px] text-[#535353]">
                          {c.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Cves;
