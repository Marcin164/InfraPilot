import { useRef, useState, useEffect } from "react";
import Modal from "react-responsive-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faCloudArrowUp,
  faCircleExclamation,
  faFileWord,
  faFilePdf,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import CardHeader from "../Headers/CardHeader";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import ButtonSecondary from "../Buttons/ButtonSecondary";

type Props = {
  isModalOpen: boolean;
  onCloseModal: () => void;
  onSubmit?: (file: File) => void;
};

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const AddFormModal = ({ isModalOpen, onCloseModal, onSubmit }: Props) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isPdf = file?.type === "application/pdf";
  const isDocx =
    file?.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const handleFile = (f: File) => {
    const validType =
      ALLOWED_TYPES.includes(f.type) ||
      f.name.endsWith(".pdf") ||
      f.name.endsWith(".docx");
    if (!validType) {
      setError(t("file.type.error") || "Nieprawidłowy typ pliku (PDF/DOCX)");
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    reset();
    onCloseModal();
  };

  return (
    <Modal
      classNames={{
        modal:
          "w-[900px] rounded-[10px] h-[85vh] max-h-[85vh] overflow-y-auto",
      }}
      open={isModalOpen}
      onClose={close}
      center
    >
      <CardHeader text={t("btn.add.form") || "Dodaj formularz"} />

      <div className="w-full space-y-4 pt-2">
        {!file && (
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
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-zinc-400"
              }`}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-blue-500/90 text-white">
                <FontAwesomeIcon
                  icon={faCloudArrowUp}
                  className="mb-2 text-4xl"
                />
                <p className="text-sm font-medium">
                  {t("file.dragging") || "Upuść plik tutaj"}
                </p>
              </div>
            )}

            <FontAwesomeIcon
              icon={faUpload}
              className="mx-auto mb-4 text-3xl"
            />
            <p className="text-sm">
              {t("file.placeholder") ||
                "Kliknij lub przeciągnij plik PDF / DOCX"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFile(e.target.files[0])
              }
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            <FontAwesomeIcon icon={faCircleExclamation} />
            {error}
          </div>
        )}

        {file && (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm font-medium">
                <FontAwesomeIcon
                  icon={isPdf ? faFilePdf : faFileWord}
                  className={isPdf ? "text-red-500" : "text-blue-500"}
                />
                <div>
                  <div>{file.name}</div>
                  <div className="text-xs text-zinc-500">
                    {formatSize(file.size)}
                  </div>
                </div>
              </div>
              <button
                onClick={reset}
                className="rounded-full px-2 py-1 text-zinc-500 hover:bg-zinc-100"
                title="Usuń"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border bg-zinc-50">
              {isPdf && previewUrl && (
                <iframe
                  src={previewUrl}
                  title="PDF preview"
                  className="h-[55vh] w-full"
                />
              )}
              {isDocx && previewUrl && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    previewUrl
                  )}&embedded=true`}
                  title="DOCX preview"
                  className="h-[55vh] w-full"
                />
              )}
            </div>

            {isDocx && (
              <p className="mt-2 text-xs text-zinc-500">
                Podgląd DOCX dostępny po wgraniu pliku na serwer.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <ButtonSecondary text={t("btn.cancel") || "Anuluj"} onClick={close} />
              <ButtonPrimary
                text={t("btn.send") || "Wyślij"}
                onClick={() => {
                  if (file && onSubmit) onSubmit(file);
                  close();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddFormModal;
