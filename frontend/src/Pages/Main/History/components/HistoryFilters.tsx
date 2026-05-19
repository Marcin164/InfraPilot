import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

  const translatedTypeOptions = historyFeedTypeOptions.map((opt) => ({
    ...opt,
    label: t(opt.label),
  }));
  const selectedTypeOptions = translatedTypeOptions.filter((opt) =>
    value.types.includes(opt.value),
  );

  return (
    <div className="flex flex-wrap items-end gap-2 px-2">
      <Input
        value={searchDraft}
        onChange={(e: any) => setSearchDraft(e.target.value)}
        placeholder={t("history.searchPlaceholder")}
        className="w-auto flex-1 min-w-[180px] max-w-[300px] pt-0"
      />

      <div className="flex-1 min-w-[180px] max-w-[280px]">
        <ReactSelect
          isMulti
          options={translatedTypeOptions}
          value={selectedTypeOptions}
          onChange={(selected: any) =>
            onChange({
              ...value,
              types: (selected ?? []).map((s: any) => s.value),
            })
          }
          placeholder={t("history.allTypes")}
          styles={selectStyles}
        />
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

      <div className="flex items-center gap-2 ml-auto">
        <ButtonPrimary
          color="white"
          icon={faXmark}
          text={t("common.reset")}
          onClick={onReset}
        />
        <ButtonPrimary
          color="blue"
          icon={faDownload}
          text={exporting ? t("common.exporting") : t("reports.exportCsv")}
          onClick={onExport}
          disabled={exporting}
        />
      </div>
    </div>
  );
};

export default HistoryFilters;
