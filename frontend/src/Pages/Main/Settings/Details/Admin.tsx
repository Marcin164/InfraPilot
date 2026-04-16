import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import { getUserSettings, updateUserSettings } from "../../../../Services/settings";
import type { LastLogonThreshold } from "../../../../Types";

const DEFAULT_THRESHOLDS: LastLogonThreshold[] = [
  { maxDays: 7, color: "#30A712", label: "Recent" },
  { maxDays: 30, color: "#F1C40F", label: "Warning" },
  { maxDays: 90, color: "#F3606E", label: "Inactive" },
];

const Admin = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const [thresholds, setThresholds] = useState<LastLogonThreshold[]>(
    DEFAULT_THRESHOLDS,
  );
  const [defaultColor, setDefaultColor] = useState("#8A8A8A");

  useEffect(() => {
    if (settingsQuery.data) {
      setThresholds(
        settingsQuery.data.lastLogonThresholds ?? DEFAULT_THRESHOLDS,
      );
      setDefaultColor(settingsQuery.data.lastLogonDefaultColor ?? "#8A8A8A");
    }
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: (data: {
      lastLogonThresholds: LastLogonThreshold[];
      lastLogonDefaultColor: string;
    }) => updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      toast.success("Settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const save = (
    next: LastLogonThreshold[],
    nextDefault: string = defaultColor,
  ) => {
    const sorted = [...next].sort((a, b) => a.maxDays - b.maxDays);
    setThresholds(sorted);
    mutation.mutate({
      lastLogonThresholds: sorted,
      lastLogonDefaultColor: nextDefault,
    });
  };

  const updateThreshold = (
    idx: number,
    field: keyof LastLogonThreshold,
    value: string | number,
  ) => {
    const next = thresholds.map((t, i) =>
      i === idx ? { ...t, [field]: value } : t,
    );
    setThresholds(next);
  };

  const removeThreshold = (idx: number) => {
    const next = thresholds.filter((_, i) => i !== idx);
    save(next);
  };

  const addThreshold = () => {
    const maxExisting = thresholds.length
      ? Math.max(...thresholds.map((t) => t.maxDays))
      : 0;
    const next = [
      ...thresholds,
      { maxDays: maxExisting + 30, color: "#535353", label: "New" },
    ];
    save(next);
  };

  const getDaysSinceText = (maxDays: number, idx: number) => {
    const prev = idx > 0 ? thresholds[idx - 1].maxDays : 0;
    if (prev === 0) return `0 – ${maxDays} days`;
    return `${prev} – ${maxDays} days`;
  };

  if (settingsQuery.isLoading) {
    return <div className="p-6 text-[#535353]">Loading…</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-6 m-4">
      <h2 className="text-[20px] font-bold text-[#3C3C3C] pb-1">
        Last Logon Colors
      </h2>
      <p className="text-[14px] text-[#535353] pb-4">
        Configure how the Last Logon column in the Users table is color-coded
        based on how many days ago a user last logged in. Thresholds are
        automatically sorted by number of days.
      </p>

      <div className="space-y-2">
        {thresholds.map((threshold, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3"
          >
            {/* Color preview + picker */}
            <div className="relative">
              <div
                className="h-[36px] w-[36px] rounded-[8px] border border-[#E0E0E0] cursor-pointer"
                style={{ backgroundColor: threshold.color }}
              />
              <input
                type="color"
                value={threshold.color}
                onChange={(e) =>
                  updateThreshold(idx, "color", e.target.value)
                }
                onBlur={() => save(thresholds)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            {/* Label */}
            <input
              type="text"
              value={threshold.label}
              onChange={(e) =>
                updateThreshold(idx, "label", e.target.value)
              }
              onBlur={() => save(thresholds)}
              className="h-[36px] w-[120px] rounded-[8px] border border-[#535353] px-2 text-[14px] font-bold text-[#3C3C3C] outline-none focus:border-[#2B9AE9]"
              placeholder="Label"
            />

            {/* Days */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#535353]">Within</span>
              <input
                type="number"
                min={1}
                value={threshold.maxDays}
                onChange={(e) =>
                  updateThreshold(
                    idx,
                    "maxDays",
                    parseInt(e.target.value) || 1,
                  )
                }
                onBlur={() => save(thresholds)}
                className="h-[36px] w-[70px] rounded-[8px] border border-[#535353] px-2 text-center text-[14px] font-bold text-[#3C3C3C] outline-none focus:border-[#2B9AE9]"
              />
              <span className="text-[13px] text-[#535353]">days</span>
            </div>

            {/* Range preview */}
            <span className="text-[12px] text-[#8A8A8A] ml-auto hidden sm:inline">
              {getDaysSinceText(threshold.maxDays, idx)}
            </span>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeThreshold(idx)}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[14px] text-[#F3606E] hover:bg-[#FDE8EA] cursor-pointer"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addThreshold}
        className="mt-3 flex items-center gap-2 rounded-[10px] border border-dashed border-[#535353] px-4 py-2 text-[14px] font-bold text-[#535353] hover:bg-[#F0F0F0] cursor-pointer transition"
      >
        <FontAwesomeIcon icon={faPlus} />
        Add threshold
      </button>

      {/* Default / fallback */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-[14px] font-bold text-[#3C3C3C]">
          Default color (older than all thresholds or never logged in):
        </span>
        <div className="relative">
          <div
            className="h-[36px] w-[36px] rounded-[8px] border border-[#E0E0E0] cursor-pointer"
            style={{ backgroundColor: defaultColor }}
          />
          <input
            type="color"
            value={defaultColor}
            onChange={(e) => setDefaultColor(e.target.value)}
            onBlur={() => save(thresholds, defaultColor)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <span className="text-[13px] text-[#8A8A8A]">
          {`> ${thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0} days / N/A`}
        </span>
      </div>

      {/* Preview */}
      <div className="mt-6">
        <h3 className="text-[16px] font-bold text-[#3C3C3C] pb-2">Preview</h3>
        <div className="flex flex-wrap gap-2">
          {thresholds.map((t, idx) => (
            <div
              key={idx}
              className="rounded-[10px] px-4 py-2 text-center text-[13px] font-bold text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.label} ({getDaysSinceText(t.maxDays, idx)})
            </div>
          ))}
          <div
            className="rounded-[10px] px-4 py-2 text-center text-[13px] font-bold text-white"
            style={{ backgroundColor: defaultColor }}
          >
            Default ({`> ${thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0} days`})
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
