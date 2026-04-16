import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FilterPreset } from "../../Types";

type Props = {
  presets: FilterPreset[];
  activePresetId?: string | null;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
};

const FilterPresetsBar = ({
  presets,
  activePresetId,
  onActivate,
  onDelete,
}: Props) => {
  if (presets.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pb-3">
      <span className="text-[13px] font-bold text-[#535353]">
        Saved filters:
      </span>
      {presets.map((preset) => {
        const isActive = preset.id === activePresetId;
        return (
          <div
            key={preset.id}
            className={`group flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold shadow-xl transition ${
              isActive
                ? "bg-[#2B9AE9] text-white"
                : "bg-white text-[#535353] hover:bg-[#F0F0F0]"
            }`}
          >
            <button
              type="button"
              onClick={() => onActivate(preset.id)}
              className="cursor-pointer"
            >
              {preset.name}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(preset.id);
              }}
              title="Delete preset"
              className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] transition cursor-pointer ${
                isActive
                  ? "hover:bg-white/20"
                  : "text-[#8A8A8A] hover:bg-[#E0E0E0]"
              }`}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FilterPresetsBar;
