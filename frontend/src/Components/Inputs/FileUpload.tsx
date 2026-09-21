import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFileLines,
  faCircleExclamation,
  faCloudArrowUp,
  faDownload,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import ExcelJS from "exceljs";
import { parseSpreadsheetFile } from "../../lib/parseSpreadsheet";
import Papa from "papaparse";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkImportUsers } from "../../Services/bulkImport";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = { close: () => void };

const ALLOWED_TYPES = [
  "text/csv",
  "text/tab-separated-values",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
];

const REQUIRED_COLUMNS = ["name", "surname", "email"];
const OPTIONAL_COLUMNS = [
  "username",
  "phone",
  "title",
  "department",
  "company",
  "office",
  "streetAddress",
  "city",
  "postalCode",
  "country",
];

const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
const PREVIEW_LIMIT = 5;

const TEMPLATE_EXAMPLE_ROW: Record<string, string> = {
  name: "Jan",
  surname: "Kowalski",
  email: "jan.kowalski@company.com",
  username: "jkowalski",
  phone: "+48123456789",
  title: "Engineer",
  department: "IT",
  company: "Acme",
  office: "Warsaw HQ",
  streetAddress: "ul. Przykladowa 1",
  city: "Warszawa",
  postalCode: "00-001",
  country: "Poland",
};

const downloadTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Users");
  sheet.columns = ALL_COLUMNS.map((col) => ({ header: col, key: col, width: 20 }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(TEMPLATE_EXAMPLE_ROW);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "infrapilot-users-template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
};

const FileUpload = ({ close }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async (users: any[]) => bulkImportUsers(users),

    onSuccess: (res) => {
      setResult(res);
      if (res.created > 0) {
        toast.success(t("import.success", { count: res.created }));
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
      if (res.errors.length > 0) {
        toast.warning(t("import.partial", { skipped: res.skipped }));
      } else {
        close();
      }
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
    let rows: any[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: file.type === "text/tab-separated-values" ? "\t" : undefined,
      step: (result, parser: any) => {
        rows.push(result.data);
        if (rows.length % 100 === 0) {
          setProgress(
            Math.min(
              99,
              Math.round((parser.getFileSize ? 0 : rows.length) % 100)
            )
          );
        }
      },
      complete: () => handleParsedData(rows),
      error: () => {
        setError(t("file.parser.error"));
        setProgress(null);
      },
    });
  };

  const parseFile = (file: File) => {
    setProgress(0);

    if (file.type === "application/vnd.oasis.opendocument.text") {
      setError(t("file.odt.error"));
      setProgress(null);
      return;
    }

    if (file.type.includes("spreadsheet") || file.name.endsWith(".xlsx")) {
      parseXLSX(file);
      return;
    }

    parseCSV(file);
  };

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("file.type.error"));
      return;
    }

    setError(null);
    setResult(null);
    setData([]);
    parseFile(file);
  };

  const previewData = data.slice(0, PREVIEW_LIMIT);

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          <FontAwesomeIcon icon={faDownload} />
          {t("file.download.template")}
        </button>
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all
          ${
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
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.odt"
          className="hidden"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
      </div>

      {progress !== null && (
        <div className="rounded-xl border bg-white px-4 py-3">
          <div className="mb-1 text-xs text-zinc-500">{t("file.pending")}</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-zinc-500">
            {progress}%
          </div>
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
            Podgląd danych (pierwsze {PREVIEW_LIMIT} z {data.length} rekordów)
          </div>

          <div className="overflow-auto rounded-lg border">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-100">
                <tr>
                  {Object.keys(previewData[0]).map((key) => (
                    <th
                      key={key}
                      className="border-b px-3 py-2 text-left font-medium"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx} className="odd:bg-zinc-50">
                    {Object.keys(previewData[0]).map((key) => (
                      <td key={key} className="px-3 py-2">
                        {String(row[key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ButtonPrimary
            onClick={() => {
              mutation.mutate(data);
            }}
            disabled={mutation.isPending}
            text={mutation.isPending ? t("import.importing") : t("file.send")}
          />
        </div>
      )}
      {result && (
        <div className="rounded-xl border bg-white p-4">
          <div className="flex gap-6 mb-2 text-sm">
            <span className="text-green-600 font-medium">
              {t("import.resultCreated")}: {result.created}
            </span>
            <span className="text-amber-600 font-medium">
              {t("import.resultSkipped")}: {result.skipped}
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              {result.errors.map((e, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-red-600"
                >
                  <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
