import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Papa from "papaparse";
import { parseSpreadsheetFile } from "../../../lib/parseSpreadsheet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileImport,
  faFileCsv,
  faFileExcel,
  faCheck,
  faTriangleExclamation,
  faCircleInfo,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import { bulkImportDevices, bulkImportUsers } from "../../../Services/bulkImport";

type EntityType = "devices" | "users";

const DEVICE_COLUMNS = [
  "assetName", "serialNumber", "group", "subgroup", "model", "manufacturer",
  "location", "lifecycle", "purchaseDate", "purchasePrice", "purchaseCurrency",
  "vendor", "warrantyEnd",
];
const USER_COLUMNS = [
  "name", "surname", "email", "phone", "department", "location", "title",
];

const DEVICE_TEMPLATE = DEVICE_COLUMNS.join(",") + "\nLaptop-001,SN123456,Computers,Laptop,ThinkPad X1,Lenovo,Building A,active,2023-01-15,1200,USD,Lenovo,2026-01-15";
const USER_TEMPLATE = USER_COLUMNS.join(",") + "\nJan,Kowalski,jan.kowalski@company.com,+48123456789,IT,Building A,Engineer";

function parseFile(file: File): Promise<Record<string, string>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data as Record<string, string>[]),
        error: reject,
      });
    });
  }
  if (ext === "xlsx" || ext === "xls") {
    return parseSpreadsheetFile(file);
  }
  return Promise.reject(new Error("Unsupported file format. Use CSV, XLS, or XLSX."));
}

function downloadTemplate(entity: EntityType) {
  const content = entity === "devices" ? DEVICE_TEMPLATE : USER_TEMPLATE;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `infrapilot-${entity}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const Import = () => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState<EntityType>("devices");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const columns = entity === "devices" ? DEVICE_COLUMNS : USER_COLUMNS;

  const handleFile = async (file: File) => {
    try {
      const parsed = await parseFile(file);
      setRows(parsed);
      setFileName(file.name);
      setResult(null);
    } catch (err: any) {
      toast.error(err?.message ?? t("import.parseFailed"));
    }
  };

  const importMutation = useMutation({
    mutationFn: () =>
      entity === "devices" ? bulkImportDevices(rows) : bulkImportUsers(rows),
    onSuccess: (data) => {
      setResult(data);
      if (data.created > 0) {
        toast.success(t("import.success", { count: data.created }));
      }
      if (data.errors.length > 0) {
        toast.warning(t("import.partial", { skipped: data.skipped }));
      }
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("import.failed")),
  });

  return (
    <PageMotion>
      <div className="w-full p-4 max-w-4xl">
        {/* Entity selector */}
        <div className="bg-white rounded-[10px] shadow-xl p-4 mb-4">
          <div className="text-[20px] font-semibold text-[#3C3C3C] mb-3">
            <FontAwesomeIcon icon={faFileImport} className="mr-2 text-[#2B9AE9]" />
            {t("import.title")}
          </div>
          <div className="flex gap-3 flex-wrap">
            {(["devices", "users"] as EntityType[]).map((e) => (
              <button
                key={e}
                onClick={() => { setEntity(e); setRows([]); setResult(null); setFileName(""); }}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-medium border transition-colors ${
                  entity === e
                    ? "bg-[#2B9AE9] text-white border-[#2B9AE9]"
                    : "bg-white text-[#3C3C3C] border-[#D0D0D0] hover:bg-[#F5F5F5]"
                }`}
              >
                {t(`import.entity.${e}`)}
              </button>
            ))}
            <button
              onClick={() => downloadTemplate(entity)}
              className="ml-auto px-3 py-2 text-[12px] text-[#2B9AE9] hover:underline border border-[#D0D0D0] rounded-[8px]"
            >
              <FontAwesomeIcon icon={faFileCsv} className="mr-1" />
              {t("import.downloadTemplate")}
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="bg-white rounded-[10px] shadow-xl p-8 mb-4 border-2 border-dashed border-[#D0D0D0] hover:border-[#2B9AE9] transition-colors cursor-pointer text-center"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <FontAwesomeIcon icon={faFileExcel} className="text-[32px] text-[#9a9a9a] mb-2" />
          <div className="text-[14px] text-[#3C3C3C] font-medium">
            {fileName || t("import.dropZone")}
          </div>
          <div className="text-[12px] text-[#9a9a9a] mt-1">{t("import.dropZoneHint")}</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Column hint */}
        <div className="bg-[#EBF5FB] rounded-[8px] px-4 py-3 mb-4 text-[12px] text-[#1A6FA8] flex gap-2 items-start">
          <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 shrink-0" />
          <span>
            {t("import.columnsHint")}:{" "}
            <code className="font-mono">{columns.join(", ")}</code>
          </span>
        </div>

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="bg-white rounded-[10px] shadow-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[15px] text-[#3C3C3C]">
                {t("import.preview", { count: rows.length })}
              </div>
              <button
                onClick={() => { setRows([]); setFileName(""); setResult(null); }}
                className="text-[#F3606E] text-[12px] hover:underline"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-1" />
                {t("import.clear")}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    {Object.keys(rows[0]).map((col) => (
                      <th
                        key={col}
                        className={`px-3 py-2 text-left text-[#9a9a9a] font-medium whitespace-nowrap ${
                          columns.includes(col) ? "" : "opacity-40"
                        }`}
                      >
                        {col}
                        {!columns.includes(col) && (
                          <span className="ml-1 text-[10px] text-[#F3606E]">?</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-[#F8F8F8] hover:bg-[#FAFAFA]">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-1.5 text-[#3C3C3C] whitespace-nowrap max-w-[200px] truncate">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <div className="text-center text-[11px] text-[#9a9a9a] py-2">
                  {t("import.moreRows", { count: rows.length - 10 })}
                </div>
              )}
            </div>

            <div className="mt-4">
              <ButtonPrimary
                icon={faCheck}
                text={
                  importMutation.isPending
                    ? t("import.importing")
                    : t("import.confirm", { count: rows.length })
                }
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-[10px] shadow-xl p-4">
            <div className="font-semibold text-[15px] mb-3">{t("import.resultTitle")}</div>
            <div className="flex gap-6 mb-3">
              <div className="text-center">
                <div className="text-[28px] font-bold text-[#30A712]">{result.created}</div>
                <div className="text-[12px] text-[#9a9a9a]">{t("import.resultCreated")}</div>
              </div>
              <div className="text-center">
                <div className="text-[28px] font-bold text-[#F1C40F]">{result.skipped}</div>
                <div className="text-[12px] text-[#9a9a9a]">{t("import.resultSkipped")}</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex gap-2 items-start text-[12px] text-[#E74C3C]">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageMotion>
  );
};

export default Import;
