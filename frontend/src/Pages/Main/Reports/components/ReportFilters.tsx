import React, { useEffect, useState } from "react";
import type { ReportMeta } from "../../../../Services/reports";
import { useDebounce } from "../../../../Hooks/useDebounce";
import ApplicationCombobox from "./ApplicationCombobox";

export type ReportFilterValues = {
  from?: string;
  to?: string;
  department?: string;
  application?: string;
};

type Props = {
  supports: NonNullable<ReportMeta["supportsFilters"]>;
  values: ReportFilterValues;
  onChange: (next: ReportFilterValues) => void;
};

const inputCls =
  "border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";

const ReportFilters = ({ supports, values, onChange }: Props) => {
  // Local state for free-text fields so typing doesn't fire a request per keystroke.
  const [departmentText, setDepartmentText] = useState(values.department ?? "");
  const debouncedDept = useDebounce(departmentText, 400);

  // Push debounced text up to parent (which triggers re-query).
  useEffect(() => {
    const next = debouncedDept || undefined;
    if (next !== values.department) onChange({ ...values, department: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDept]);

  // Sync external clears (Clear button) back into local state.
  useEffect(() => {
    if ((values.department ?? "") !== departmentText) {
      setDepartmentText(values.department ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.department]);

  const set = (patch: Partial<ReportFilterValues>) =>
    onChange({ ...values, ...patch });

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-end">
      {supports.includes("from") && (
        <label className="flex flex-col text-xs text-gray-500">
          From
          <input
            type="date"
            className={inputCls}
            value={values.from ?? ""}
            onChange={(e) => set({ from: e.target.value || undefined })}
          />
        </label>
      )}
      {supports.includes("to") && (
        <label className="flex flex-col text-xs text-gray-500">
          To
          <input
            type="date"
            className={inputCls}
            value={values.to ?? ""}
            onChange={(e) => set({ to: e.target.value || undefined })}
          />
        </label>
      )}
      {supports.includes("department") && (
        <label className="flex flex-col text-xs text-gray-500">
          Department
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Engineering"
            value={departmentText}
            onChange={(e) => setDepartmentText(e.target.value)}
          />
        </label>
      )}
      {supports.includes("application") && (
        <label className="flex flex-col text-xs text-gray-500">
          Application
          <ApplicationCombobox
            value={values.application}
            onChange={(next) => set({ application: next })}
          />
        </label>
      )}
      {(values.from || values.to || values.department || values.application) && (
        <button
          type="button"
          onClick={() => {
            setDepartmentText("");
            onChange({});
          }}
          className="text-xs text-gray-500 underline self-center"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default ReportFilters;
