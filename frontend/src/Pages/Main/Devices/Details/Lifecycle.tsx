import { useEffect, useState } from "react";
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
  const device: any = useOutletContext();
  const data = device?.data ?? {};
  const queryClient = useQueryClient();

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
      toast.success("Lifecycle updated");
      queryClient.invalidateQueries({ queryKey: ["device"] });
      setEditing(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Update failed"),
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
        <CardHeader text="Asset lifecycle" icon={faBoxArchive} />
        {!editing ? (
          <ButtonPrimary
            icon={faPen}
            text="Edit"
            onClick={() => setEditing(true)}
          />
        ) : (
          <div className="flex gap-2">
            <ButtonPrimary
              icon={faCheck}
              text={mutation.isPending ? "Saving…" : "Save"}
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            />
            <ButtonPrimary
              icon={faXmark}
              text="Cancel"
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
            {currentState.label}
          </span>
        ) : (
          <div className="min-w-[200px]">
            <SelectSecondary
              options={LIFECYCLE_STATES}
              value={LIFECYCLE_STATES.find(
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
              ? `Warranty: ${warrantyDaysLeft} days left`
              : `Warranty expired ${-warrantyDaysLeft} days ago`}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="text-[12px] text-[#9a9a9a]">Note</div>
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
            <div className="text-[11px] text-[#9a9a9a]">{f.label}</div>
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
