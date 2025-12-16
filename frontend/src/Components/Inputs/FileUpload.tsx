import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFileLines,
  faCircleExclamation,
  faCloudArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { addManyUsers } from "../../Services/users";
import { toast } from "react-toastify";

type Props = { close: any };

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

const FileUpload = ({ close }: Props) => {
  const { accessToken } = useAuthInfo();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (users: Record<string, any>) => {
      if (!accessToken) throw new Error("User is not authenticated.");
      addManyUsers(accessToken, users);
    },

    onSuccess: () => {
      toast.success("User has been added uccessfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      close();
    },
  });
  const validateColumns = (headers: string[]) => {
    const normalized = headers.map((h) => h.trim());
    const missing = REQUIRED_COLUMNS.filter((c) => !normalized.includes(c));
    return missing.length ? missing : null;
  };

  const handleParsedData = (rows: any[]) => {
    if (!rows.length) {
      setError("Plik nie zawiera danych");
      setProgress(null);
      return;
    }

    const headers = Object.keys(rows[0]);
    const missing = validateColumns(headers);

    if (missing) {
      setError(`Brak wymaganych kolumn: ${missing.join(", ")}`);
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

  const parseXLSX = (file: File) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    reader.onload = (e) => {
      setProgress(90);
      const wb = XLSX.read(e.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
      handleParsedData(json as any[]);
    };

    reader.readAsBinaryString(file);
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
        setError("Błąd parsowania pliku");
        setProgress(null);
      },
    });
  };

  const parseFile = (file: File) => {
    setProgress(0);

    if (file.type === "application/vnd.oasis.opendocument.text") {
      setError("ODT nie jest wspierany do parsowania w przeglądarce");
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
      setError("Nieobsługiwany typ pliku");
      return;
    }

    setError(null);
    setData([]);
    parseFile(file);
  };

  const previewData = data.slice(0, PREVIEW_LIMIT);

  return (
    <div className="w-full max-w-3xl space-y-4">
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
            <p className="text-sm font-medium">Upuść plik aby załadować</p>
          </div>
        )}

        <FontAwesomeIcon icon={faUpload} className="mx-auto mb-4 text-3xl" />
        <p className="text-sm">Kliknij lub przeciągnij plik CSV / TSV / XLSX</p>
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
          <div className="mb-1 text-xs text-zinc-500">Przetwarzanie pliku</div>
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

          <button
            onClick={() => {
              mutation.mutate(data);
            }}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Wyślij dane
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
