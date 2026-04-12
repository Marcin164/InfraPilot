import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import Input from "../../../../Components/Inputs/Input";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { faDownload, faXmark } from "@fortawesome/free-solid-svg-icons";
import { historyFeedTypeOptions } from "../constants";
import type { HistoryType } from "../../../../Types";
import SearchCombobox from "./SearchCombobox";
import type { ComboboxOption } from "./SearchCombobox";
import { getDevices } from "../../../../Services/devices";
import { getUsersTable } from "../../../../Services/users";

export type HistoryFiltersState = {
  types: HistoryType[];
  from: string;
  to: string;
  q: string;
  deviceId?: string;
  userId?: string;
};

type Props = {
  value: HistoryFiltersState;
  onChange: (next: HistoryFiltersState) => void;
  onReset: () => void;
  onExport: () => void;
  exporting?: boolean;
};

const selectStyles: any = {
  control: (styles: any) => ({
    ...styles,
    minHeight: "42px",
    borderColor: "#3C3C3C",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    paddingLeft: "4px",
  }),
  menu: (styles: any) => ({ ...styles, zIndex: 20 }),
};

const fetchDeviceOptions = async (
  search: string,
): Promise<ComboboxOption[]> => {
  const result = await getDevices(
    `search=${encodeURIComponent(search)}&limit=10`,
  );
  return (result.data ?? []).map((d: any) => ({
    value: d.id ?? d.deviceId,
    label:
      d.assetName ||
      [d.manufacturer, d.model].filter(Boolean).join(" ") ||
      "Device",
    detail: d.serialNumber ?? undefined,
  }));
};

const fetchUserOptions = async (search: string): Promise<ComboboxOption[]> => {
  const result = await getUsersTable(
    `search=${encodeURIComponent(search)}&limit=10`,
  );
  return (result.data ?? []).map((u: any) => ({
    value: u.id,
    label:
      [u.name, u.surname].filter(Boolean).join(" ") || u.username || "User",
    detail: u.department ?? u.email ?? undefined,
  }));
};

const HistoryFilters = ({
  value,
  onChange,
  onReset,
  onExport,
  exporting,
}: Props) => {
  const [searchDraft, setSearchDraft] = useState(value.q);

  useEffect(() => {
    setSearchDraft(value.q);
  }, [value.q]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== value.q) {
        onChange({ ...value, q: searchDraft });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchDraft]);

  const selectedTypeOptions = historyFeedTypeOptions.filter((opt) =>
    value.types.includes(opt.value),
  );

  return (
    <div className="flex px-2 gap-3 md:items-end">
      <Input
        value={searchDraft}
        onChange={(e: any) => setSearchDraft(e.target.value)}
        placeholder="Ticket, serial, user, details..."
      />

      <div>
        <div className="mt-2">
          <ReactSelect
            isMulti
            options={historyFeedTypeOptions}
            value={selectedTypeOptions}
            onChange={(selected: any) =>
              onChange({
                ...value,
                types: (selected ?? []).map((s: any) => s.value),
              })
            }
            placeholder="All types"
            styles={selectStyles}
          />
        </div>
      </div>

      <Input
        type="date"
        value={value.from}
        name="history-from"
        onChange={(e: any) => onChange({ ...value, from: e.target.value })}
        className="pt-0"
      />

      <Input
        type="date"
        value={value.to}
        name="history-to"
        onChange={(e: any) => onChange({ ...value, to: e.target.value })}
        className="pt-0"
      />

      <ButtonPrimary
        color="white"
        icon={faXmark}
        text="Reset"
        onClick={onReset}
      />

      <ButtonPrimary
        color="blue"
        icon={faDownload}
        text={exporting ? "Exporting…" : "Export CSV"}
        onClick={onExport}
        disabled={exporting}
      />
    </div>
  );
};

export default HistoryFilters;
