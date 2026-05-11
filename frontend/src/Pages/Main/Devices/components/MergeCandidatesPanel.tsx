import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import moment from "moment";
import {
  faCodeMerge,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getMergeCandidates,
  mergeDevicesApi,
  MergeCandidate,
} from "../../../../Services/devices";

type Props = {
  device: any;
};

const MergeCandidatesPanel = ({ device }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [manualSource, setManualSource] = useState("");
  const [showManual, setShowManual] = useState(false);

  const candidatesQuery = useQuery({
    queryKey: ["merge-candidates", device?.id],
    queryFn: () => getMergeCandidates(device.id),
    enabled: Boolean(device?.id),
  });

  const mergeMutation = useMutation({
    mutationFn: (sourceId: string) => mergeDevicesApi(device.id, sourceId),
    onSuccess: (res) => {
      const moved = Object.entries(res.moved)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${k}: ${n}`)
        .join(", ");
      toast.success(`Merged. Moved ${moved || "nothing"}`);
      queryClient.invalidateQueries({
        queryKey: ["merge-candidates", device.id],
      });
      queryClient.invalidateQueries({ queryKey: ["device", device.id] });
      setManualSource("");
      setShowManual(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Merge failed"),
  });

  const confirmMerge = (sourceId: string, label: string) => {
    if (
      !window.confirm(
        `Merge "${label}" into this device?\n\nAll tickets, scans, software installs, tasks, compliance and tags from "${label}" will be repointed to this device. The source row stays as a tombstone with mergedIntoId set, but its agent secret is cleared.`,
      )
    )
      return;
    mergeMutation.mutate(sourceId);
  };

  if (device?.mergedIntoId) {
    return (
      <div className="bg-[#FDF5F6] border border-[#F3D3D7] rounded-[10px] p-4 mt-4">
        <div className="flex items-center gap-2 text-[#C0392B]">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <span className="font-bold text-[14px]">
            This device has been merged into another record.
          </span>
        </div>
        <ButtonPrimary
          icon={faCodeMerge}
          color="white"
          text={t("device.merge.openCanonical")}
          className="mt-2"
          onClick={() =>
            navigate(`/admin/devices/${device.mergedIntoId}/system`)
          }
        />
      </div>
    );
  }

  const candidates: MergeCandidate[] = candidatesQuery.data ?? [];

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4 mt-4">
      <CardHeader text={t("device.merge.duplicates")} icon={faCodeMerge} />
      <p className="text-[12px] text-[#7a7a7a] mt-2">
        Devices whose identity fingerprint (TPM, MAC, CPU id, serial)
        overlaps with this one. Use after a reformat or motherboard swap to
        merge a duplicate record back in. Source becomes a tombstone — no
        history is lost.
      </p>

      {candidatesQuery.isLoading ? (
        <div className="mt-3 text-[13px] text-[#7a7a7a]">Loading…</div>
      ) : candidates.length === 0 ? (
        <div className="mt-3 text-[13px] text-[#7a7a7a]">
          No duplicates detected from current fingerprint.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {candidates.map((c) => (
            <div
              key={c.device.id}
              className="rounded-[8px] border border-[#E0E0E0] p-3 flex items-start gap-3"
            >
              <div
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white shrink-0 ${
                  c.score >= 100
                    ? "bg-[#C0392B]"
                    : c.score >= 60
                      ? "bg-[#F3606E]"
                      : "bg-[#F1C40F]"
                }`}
              >
                score {c.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] text-[#3C3C3C]">
                  {c.device.assetName ??
                    `${c.device.manufacturer ?? ""} ${c.device.model ?? ""}`.trim() ??
                    c.device.id}
                </div>
                <div className="text-[11px] text-[#7a7a7a] mt-0.5">
                  SN: {c.device.serialNumber ?? "—"} · last scan{" "}
                  {c.device.lastScanAt
                    ? moment(c.device.lastScanAt).fromNow()
                    : "never"}
                </div>
                <div className="text-[11px] text-[#535353] mt-1">
                  {c.reasons.join(" · ")}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <ButtonPrimary
                  color="white"
                  text={t("device.merge.view")}
                  onClick={() =>
                    navigate(`/admin/devices/${c.device.id}/system`)
                  }
                />
                <ButtonPrimary
                  icon={faCodeMerge}
                  text={t("device.merge.mergeInto")}
                  onClick={() =>
                    confirmMerge(
                      c.device.id,
                      c.device.assetName ?? c.device.id,
                    )
                  }
                  disabled={mergeMutation.isPending}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="text-[12px] text-[#2B9AE9] hover:underline cursor-pointer"
        >
          {showManual ? "Hide manual merge" : "Manual merge by ID →"}
        </button>
        {showManual && (
          <div className="mt-2 flex items-end gap-2">
            <Input
              className="flex-1 pt-0"
              label="Source device ID"
              value={manualSource}
              handleChange={setManualSource}
              placeholder={t("device.merge.placeholder")}
            />
            <ButtonPrimary
              icon={faCodeMerge}
              text={mergeMutation.isPending ? "Merging…" : "Merge"}
              onClick={() => {
                const v = manualSource.trim();
                if (!v) return;
                confirmMerge(v, v);
              }}
              disabled={mergeMutation.isPending || !manualSource.trim()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MergeCandidatesPanel;
