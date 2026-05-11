import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import Checkbox from "../Inputs/Checkbox";

const VALUE_KEYS: Record<string, string> = {
  Incident: "form.ticketType.incident",
  Service: "form.ticketType.service",
  Low: "form.priority.low",
  Medium: "form.priority.medium",
  High: "form.priority.high",
  Critical: "form.priority.critical",
  "Single user": "options.ticket.impact.singleUser",
  "Multiple users": "options.ticket.impact.multipleUsers",
  "Whole company": "options.ticket.impact.wholeCompany",
  New: "options.ticket.state.new",
  Assigned: "options.ticket.state.assigned",
  "In progress": "options.ticket.state.inProgress",
  "Awaiting for user": "options.ticket.state.awaitingForUser",
  "Awaiting for vendor": "options.ticket.state.awaitingForVendor",
  Resolved: "options.ticket.state.resolved",
  Closed: "options.ticket.state.closed",
  Cancelled: "options.ticket.state.cancelled",
  Computers: "options.group.computers",
  Peripherals: "options.group.peripherals",
  Network: "options.group.network",
  Components: "options.group.components",
  Other: "options.group.other",
};

type Props = {
  filters: Record<string, string[] | undefined>;
  setFilters: React.Dispatch<
    React.SetStateAction<Record<string, string[] | undefined>>
  >;
  filterOptions: Record<string, string[]>;
  onSavePreset?: (name: string) => void;
};

const FilterModal = ({
  filters,
  setFilters,
  filterOptions,
  onSavePreset,
}: Props) => {
  const { t } = useTranslation();
  const [presetName, setPresetName] = useState("");

  const labelForGroup = (key: string) =>
    t(`filter.group.${key}`, { defaultValue: key });

  const labelForValue = (value: string) => {
    const key = VALUE_KEYS[value];
    return key ? t(key) : value;
  };

  const toggleValue = (key: string, value: string) => {
    setFilters((prev) => {
      const current = prev[key] ?? [];
      const exists = current.includes(value);

      return {
        ...prev,
        [key]: exists
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const hasAnyFilter = Object.values(filters).some(
    (v) => Array.isArray(v) && v.length > 0,
  );

  const handleSave = () => {
    if (!onSavePreset) return;
    const trimmed = presetName.trim();
    if (!trimmed) return;
    onSavePreset(trimmed);
    setPresetName("");
  };

  return (
    <div
      className="w-[300px] max-h-[480px] absolute bg-white shadow-xl rounded-[10px]
      mt-2 flex flex-col z-[50]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 overflow-y-auto px-2 pt-1 pb-2">
        {Object.entries(filterOptions).map(([key, options]) => (
          <div key={key}>
            <div className="text-[#3C3C3C] text-[16px] font-bold py-2 capitalize">
              {labelForGroup(key)}
            </div>

            {options.map((option, idx) => (
              <Checkbox
                key={idx}
                name={key}
                label={labelForValue(option)}
                value={option}
                id={`${key}-${idx}`}
                checked={filters[key]?.includes(option) ?? false}
                onChange={() => toggleValue(key, option)}
              />
            ))}
          </div>
        ))}
      </div>

      {onSavePreset && (
        <div className="border-t border-[#E0E0E0] p-2">
          <div className="pb-1 text-[12px] font-bold text-[#535353]">
            {t("filter.saveCurrent")}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder={t("filter.namePlaceholder")}
              className="h-[32px] flex-1 rounded-[8px] border border-[#535353] px-2 text-[13px] outline-none focus:border-[#2B9AE9]"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasAnyFilter || !presetName.trim()}
              title={t("filter.saveTitle")}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#2B9AE9] text-white transition hover:bg-[#1E86D1] disabled:cursor-not-allowed disabled:bg-[#B8D9EC]"
            >
              <FontAwesomeIcon icon={faBookmark} className="text-[12px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterModal;
