import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFileLines,
  faCircleExclamation,
  faCloudArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import { parseSpreadsheetFile } from "../../lib/parseSpreadsheet";
import Papa from "papaparse";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkImportDevices } from "../../Services/bulkImport";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = { close: () => void };

const ALLOWED_TYPES = [
  "text/csv",
  "text/tab-separated-values",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const REQUIRED_COLUMNS = ["assetName", "serialNumber"];
const ALL_COLUMNS = [
  "assetName", "serialNumber", "group", "subgroup", "model", "manufacturer",
  "location", "lifecycle", "purchaseDate", "purchasePrice", "purchaseCurrency",
  "vendor", "warrantyEnd",
];
const PREVIEW_LIMIT = 5;

const FileUploadDevices = ({ close }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (rows: any[]) => bulkImportDevices(rows),
    onSuccess: (result) => {
      if (result.created > 0) {
        toast.success(t("import.success", { count: result.created }));
        queryClient.invalidateQueries({ queryKey: ["devices"] });
      }
      if (result.errors.length > 0) {
        toast.warning(t("import.partial", { skipped: result.skipped }));
      }
      close();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("import.failed"));
    },
  });

  const validateColumns = (headers: string[]) => {
    const normalized = headers.map((h) => h.trim());
    const missing = REQUIRED_COLUMNS.filter((c) => !normalized.includes(c));
    return missing.length ? missing : null;
  };

  const handleParsedData = (rows: any[]) => {
    if (!rows.length) {
      setError(t("file.no.data"));
      setProgress(null);
      return;
    }

    const headers = Object.keys(rows[0]);
    const missing = validateColumns(headers);
    if (missing) {
      setError(`${t("file.no.columns")}: ${missing.join(", ")}`);
      setProgress(null);
      return;
    }

    const filtered = rows.map((row) => {
      const obj: any = {};
      ALL_COLUMNS.forEach((col) => {
        if (row[col] !== undefined) obj[col] = row[col];
      });
      return obj;
    });

    setError(null);
    setData(filtered);
    setProgress(null);
  };

  const parseXLSX = async (file: File) => {
    try {
      setProgress(50);
      const json = await parseSpreadsheetFile(file);
      setProgress(90);
      handleParsedData(json);
    } catch {
      setError(t("file.parser.error"));
      setProgress(null);
    }
  };

  const parseCSV = (file: File) => {
    const rows: any[] = [];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: file.type === "text/tab-separated-values" ? "\t" : undefined,
      step: (result) => rows.push(result.data),
      complete: () => handleParsedData(rows),
      error: () => {
        setError(t("file.parser.error"));
        setProgress(null);
      },
    });
  };

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
      setError(t("file.type.error"));
      return;
    }
    setError(null);
    setData([]);
    setProgress(0);
    if (file.type.includes("spreadsheet") || file.name.endsWith(".xlsx")) {
      parseXLSX(file);
    } else {
      parseCSV(file);
    }
  };

  const previewData = data.slice(0, PREVIEW_LIMIT);

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging ? "border-blue-500 bg-blue-50" : "hover:border-zinc-400"
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-blue-500/90 text-white">
            <FontAwesomeIcon icon={faCloudArrowUp} className="mb-2 text-4xl" />
            <p className="text-sm font-medium">{t("file.dragging")}</p>
          </div>
        )}
        <FontAwesomeIcon icon={faUpload} className="mx-auto mb-4 text-3xl" />
        <p className="text-sm">{t("file.placeholder")}</p>
        <p className="text-xs text-zinc-400 mt-1">
          {t("file.device.columns")}: {ALL_COLUMNS.join(", ")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
        />
      </div>

      {progress !== null && (
        <div className="rounded-xl border bg-white px-4 py-3">
          <div className="mb-1 text-xs text-zinc-500">{t("file.pending")}</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 text-right text-xs text-zinc-500">{progress}%</div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          <FontAwesomeIcon icon={faCircleExclamation} />
          {error}
        </div>
      )}

      {data.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FontAwesomeIcon icon={faFileLines} />
            {t("import.preview", { count: data.length })}
          </div>
          <div className="overflow-auto rounded-lg border">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-100">
                <tr>
                  {Object.keys(previewData[0]).map((key) => (
                    <th key={key} className="border-b px-3 py-2 text-left font-medium whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx} className="odd:bg-zinc-50">
                    {Object.keys(previewData[0]).map((key) => (
                      <td key={key} className="px-3 py-2 whitespace-nowrap">
                        {String(row[key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > PREVIEW_LIMIT && (
            <p className="mt-2 text-center text-xs text-zinc-400">
              +{data.length - PREVIEW_LIMIT} {t("import.moreRows", { count: data.length - PREVIEW_LIMIT })}
            </p>
          )}
          <div className="mt-3">
            <ButtonPrimary
              text={mutation.isPending ? t("import.importing") : t("file.send")}
              onClick={() => mutation.mutate(data)}
              disabled={mutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadDevices;
