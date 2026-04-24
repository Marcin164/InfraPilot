import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { toast } from "react-toastify";
import moment from "moment";
import {
  faShield,
  faCheck,
  faXmark,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import {
  complianceForDevice,
  evaluateDevice,
  ComplianceResult,
} from "../../../../Services/compliance";

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#C0392B",
  HIGH: "#F3606E",
  MEDIUM: "#F1C40F",
  LOW: "#2B9AE9",
};

const Compliance = () => {
  const device: any = useOutletContext();
  const deviceId = device?.data?.id;
  const queryClient = useQueryClient();

  const resultsQuery = useQuery({
    queryKey: ["compliance-device", deviceId],
    queryFn: () => complianceForDevice(deviceId),
    enabled: Boolean(deviceId),
  });

  const reeval = useMutation({
    mutationFn: () => evaluateDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-device", deviceId] });
      toast.success("Compliance re-evaluated");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Re-evaluation failed"),
  });

  const results = resultsQuery.data ?? [];
  const failing = results.filter((r: ComplianceResult) => !r.passed);
  const passing = results.filter((r: ComplianceResult) => r.passed);
  const pct =
    results.length > 0
      ? Math.round((passing.length / results.length) * 100)
      : 100;

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex items-start justify-between">
        <CardHeader text="Compliance baseline" icon={faShield} />
        <ButtonPrimary
          icon={faRotate}
          text={reeval.isPending ? "Evaluating…" : "Re-evaluate"}
          onClick={() => reeval.mutate()}
          disabled={reeval.isPending}
        />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div
          className={`text-[32px] font-bold ${
            pct === 100
              ? "text-[#30A712]"
              : pct >= 80
                ? "text-[#F1C40F]"
                : "text-[#F3606E]"
          }`}
        >
          {pct}%
        </div>
        <div className="text-[13px] text-[#7a7a7a]">
          <div>
            <span className="font-bold text-[#30A712]">
              {passing.length} passing
            </span>
            {failing.length > 0 && (
              <>
                {" · "}
                <span className="font-bold text-[#F3606E]">
                  {failing.length} failing
                </span>
              </>
            )}
          </div>
          {results[0]?.evaluatedAt && (
            <div>
              Last evaluated{" "}
              {moment(results[0].evaluatedAt).format("DD.MM.YYYY HH:mm")}
            </div>
          )}
        </div>
      </div>

      {failing.length > 0 && (
        <div className="mt-5">
          <div className="text-[14px] font-bold text-[#3C3C3C] mb-2">
            Failing rules
          </div>
          <div className="space-y-2">
            {failing.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-[8px] border border-[#F3D3D7] bg-[#FDF5F6] px-3 py-2"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                  className="text-[#C0392B] mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3C3C3C]">
                      {r.rule?.name ?? r.ruleKey}
                    </span>
                    <span
                      className="text-[11px] font-bold rounded-full px-2 py-0.5 text-white"
                      style={{ backgroundColor: SEVERITY_COLOR[r.severity] }}
                    >
                      {r.severity}
                    </span>
                  </div>
                  {r.message && (
                    <div className="text-[12px] text-[#7a7a7a] mt-0.5">
                      {r.message}
                    </div>
                  )}
                  <div className="text-[11px] text-[#9a9a9a] mt-0.5">
                    path: <code>{r.rule?.jsonPath}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {passing.length > 0 && (
        <div className="mt-5">
          <div className="text-[14px] font-bold text-[#3C3C3C] mb-2">
            Passing ({passing.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {passing.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-[6px] border border-[#DFF0D8] bg-[#F6FBF1] px-3 py-2 text-[13px]"
              >
                <FontAwesomeIcon icon={faCheck} className="text-[#30A712]" />
                <span className="text-[#3C3C3C]">
                  {r.rule?.name ?? r.ruleKey}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && (
        <div className="mt-6 text-[13px] text-[#7a7a7a]">
          No compliance rules have been evaluated yet. Trigger a scan or click
          Re-evaluate.
        </div>
      )}
    </div>
  );
};

export default Compliance;
