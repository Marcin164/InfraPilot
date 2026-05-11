import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { toast } from "react-toastify";
import {
  faCheck,
  faPen,
  faXmark,
  faBoxArchive,
} from "@fortawesome/free-solid-svg-icons";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import MergeCandidatesPanel from "../components/MergeCandidatesPanel";
import {
  DeviceLifecyclePatch,
  updateDeviceLifecycle,
} from "../../../../Services/devices";

const LIFECYCLE_STATES = [
  { value: "procurement", label: "Procurement", color: "#8A8A8A" },
  { value: "active", label: "Active", color: "#30A712" },
  { value: "in_repair", label: "In repair", color: "#F1C40F" },
  { value: "in_storage", label: "In storage", color: "#2B9AE9" },
  { value: "retired", label: "Retired", color: "#8E44AD" },
  { value: "disposed", label: "Disposed", color: "#7F8C8D" },
  { value: "lost", label: "Lost", color: "#F3606E" },
];

const FIELDS: { key: keyof DeviceLifecyclePatch; label: string; type: string }[] = [
  { key: "purchaseDate", label: "Purchase date", type: "date" },
  { key: "purchasePrice", label: "Purchase price", type: "number" },
  { key: "purchaseCurrency", label: "Currency", type: "text" },
  { key: "vendor", label: "Vendor", type: "text" },
  { key: "purchaseOrder", label: "Purchase order", type: "text" },
  { key: "warrantyStart", label: "Warranty start", type: "date" },
  { key: "warrantyEnd", label: "Warranty end", type: "date" },
  { key: "retiredAt", label: "Retired at", type: "date" },
  { key: "disposedAt", label: "Disposed at", type: "date" },
  { key: "disposalMethod", label: "Disposal method", type: "text" },
];

const toInputValue = (v: any): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" && v.includes("T")) return v.slice(0, 10);
  return String(v);
};

const Lifecycle = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const data = device?.data ?? {};
  const queryClient = useQueryClient();

  const stateLabel = (val: string) => {
    switch (val) {
      case "procurement":
        return t("device.lifecycle.procurement");
      case "active":
        return t("device.lifecycle.active");
      case "in_repair":
        return t("device.lifecycle.repair");
      case "in_storage":
        return t("device.lifecycle.storage");
      case "retired":
        return t("device.lifecycle.retired");
      case "disposed":
        return t("device.lifecycle.disposed");
      case "lost":
        return t("device.lifecycle.lost");
      default:
        return val;
    }
  };

  const fieldLabel = (key: string) => {
    switch (key) {
      case "purchaseDate":
        return t("device.lifecycle.purchaseDate");
      case "purchasePrice":
        return t("device.lifecycle.purchasePrice");
      case "purchaseCurrency":
        return t("device.lifecycle.currency");
      case "vendor":
        return t("device.lifecycle.vendor");
      case "purchaseOrder":
        return t("device.lifecycle.purchaseOrder");
      case "warrantyStart":
        return t("device.lifecycle.warrantyStart");
      case "warrantyEnd":
        return t("device.lifecycle.warrantyEnd");
      case "retiredAt":
        return t("device.lifecycle.retiredAt");
      case "disposedAt":
        return t("device.lifecycle.disposedAt");
      case "disposalMethod":
        return t("device.lifecycle.disposalMethod");
      default:
        return key;
    }
  };

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DeviceLifecyclePatch>({});

  useEffect(() => {
    setDraft({
      lifecycle: data.lifecycle ?? "active",
      lifecycleNote: data.lifecycleNote ?? "",
      purchaseDate: toInputValue(data.purchaseDate),
      purchasePrice: data.purchasePrice ?? "",
      purchaseCurrency: data.purchaseCurrency ?? "",
      vendor: data.vendor ?? "",
      purchaseOrder: data.purchaseOrder ?? "",
      warrantyStart: toInputValue(data.warrantyStart),
      warrantyEnd: toInputValue(data.warrantyEnd),
      retiredAt: toInputValue(data.retiredAt),
      disposedAt: toInputValue(data.disposedAt),
      disposalMethod: data.disposalMethod ?? "",
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateDeviceLifecycle(data.id, draft),
    onSuccess: () => {
      toast.success(t("device.lifecycle.updated"));
      queryClient.invalidateQueries({ queryKey: ["device"] });
      setEditing(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.lifecycle.updateFailed")),
  });

  const currentState =
    LIFECYCLE_STATES.find((s) => s.value === data.lifecycle) ??
    LIFECYCLE_STATES[1];

  const warrantyDaysLeft = data.warrantyEnd
    ? Math.ceil(
        (new Date(data.warrantyEnd).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div>
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex justify-between items-start">
        <CardHeader text={t("device.lifecycle.title")} icon={faBoxArchive} />
        {!editing ? (
          <ButtonPrimary
            icon={faPen}
            text={t("common.edit")}
            onClick={() => setEditing(true)}
          />
        ) : (
          <div className="flex gap-2">
            <ButtonPrimary
              icon={faCheck}
              text={mutation.isPending ? t("common.saving") : t("common.save")}
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            />
            <ButtonPrimary
              icon={faXmark}
              text={t("common.cancel")}
              onClick={() => setEditing(false)}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!editing ? (
          <span
            className="rounded-full px-3 py-1 text-[13px] font-bold text-white"
            style={{ backgroundColor: currentState.color }}
          >
            {stateLabel(currentState.value)}
          </span>
        ) : (
          <div className="min-w-[200px]">
            <SelectSecondary
              options={LIFECYCLE_STATES.map((s) => ({ ...s, label: stateLabel(s.value) }))}
              value={LIFECYCLE_STATES.map((s) => ({ ...s, label: stateLabel(s.value) })).find(
                (s) => s.value === (draft.lifecycle ?? "active"),
              )}
              onSelect={(opt: any) =>
                opt?.value && setDraft({ ...draft, lifecycle: opt.value })
              }
            />
          </div>
        )}
        {warrantyDaysLeft !== null && (
          <span
            className={`text-[13px] font-bold ${
              warrantyDaysLeft < 30
                ? "text-[#F3606E]"
                : warrantyDaysLeft < 90
                  ? "text-[#F1C40F]"
                  : "text-[#30A712]"
            }`}
          >
            {warrantyDaysLeft > 0
              ? t("device.lifecycle.warrantyDaysLeft", { days: warrantyDaysLeft })
              : t("device.lifecycle.warrantyExpired", { days: -warrantyDaysLeft })}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="text-[12px] text-[#9a9a9a]">{t("device.lifecycle.note")}</div>
        {editing ? (
          <textarea
            value={draft.lifecycleNote ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, lifecycleNote: e.target.value })
            }
            rows={2}
            className="w-full rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
          />
        ) : (
          <div className="text-[14px] text-[#3C3C3C]">
            {data.lifecycleNote || "—"}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div
            key={f.key as string}
            className="border border-[#F0F0F0] rounded-[6px] px-3 py-2"
          >
            <div className="text-[11px] text-[#9a9a9a]">{fieldLabel(f.key as string)}</div>
            {editing ? (
              <input
                type={f.type}
                value={(draft[f.key] as any) ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, [f.key]: e.target.value })
                }
                className="w-full mt-1 h-[30px] rounded-[4px] border border-[#D0D0D0] px-2 text-[13px]"
              />
            ) : (
              <div className="font-bold text-[#3C3C3C] break-all">
                {toInputValue(data[f.key]) || "—"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <MergeCandidatesPanel device={data} />
    </div>
  );
};

export default Lifecycle;
