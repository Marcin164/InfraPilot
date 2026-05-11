import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheck,
  faCircleExclamation,
  faComputerMouse,
  faLaptop,
  faPaperclip,
  faWrench,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import {
  createCommentWithAttachment,
  createTicket,
  getTicketCategories,
} from "../../../Services/tickets";
import { getDevicesByOwner } from "../../../Services/devices";
import type { Device, TicketType } from "../../../Types";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";

type Step = "type" | "category" | "details";

const ACCEPTED_TYPES = ".mp3,.mp4,.png,.jpg,.jpeg,.pdf,.wav,.webm,.ogg";
const ACCEPTED_MIMES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
]);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const TypeTile = ({
  label,
  description,
  icon,
  active,
  onClick,
}: {
  label: string;
  description: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={twMerge(
      "flex w-[260px] flex-col items-start gap-2 rounded-[14px] border-2 bg-white p-6 text-left transition",
      active
        ? "border-[#2B9AE9] bg-[#EBF5FE] shadow-lg"
        : "border-[#E0E0E0] hover:border-[#B5D9F5]",
    )}
  >
    <FontAwesomeIcon
      icon={icon}
      className={twMerge(
        "text-[28px]",
        active ? "text-[#2B9AE9]" : "text-[#8A8A8A]",
      )}
    />
    <span className="text-[18px] font-bold text-[#3C3C3C]">{label}</span>
    <span className="text-[13px] text-[#8A8A8A]">{description}</span>
  </button>
);

const deviceIcon = (subgroup: string) => {
  switch (subgroup) {
    case "Laptop":
    case "Desktop":
    case "Macbook":
      return faLaptop;
    default:
      return faComputerMouse;
  }
};

const DeviceTile = ({
  device,
  active,
  onClick,
}: {
  device: Device;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={twMerge(
      "flex min-w-[220px] items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition",
      active
        ? "border-[#2B9AE9] bg-[#EBF5FE]"
        : "border-[#E0E0E0] bg-white hover:border-[#B5D9F5]",
    )}
  >
    <FontAwesomeIcon
      icon={deviceIcon(device.subgroup)}
      className={twMerge(
        "text-[20px]",
        active ? "text-[#2B9AE9]" : "text-[#8A8A8A]",
      )}
    />
    <div className="min-w-0">
      <div className="truncate text-[14px] font-bold text-[#3C3C3C]">
        {device.assetName || device.model}
      </div>
      <div className="truncate text-[12px] text-[#8A8A8A]">
        {device.model} · {device.serialNumber}
      </div>
    </div>
  </button>
);

const NewTicket = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  const [step, setStep] = useState<Step>("type");
  const [type, setType] = useState<TicketType | null>(null);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["ticket-categories"],
    queryFn: getTicketCategories,
  });

  const devicesQuery = useQuery({
    queryKey: ["user-account-devices", currentUserId],
    queryFn: () => getDevicesByOwner(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const categories = useMemo(() => {
    if (!type || !categoriesQuery.data) return [];
    return categoriesQuery.data[type] ?? [];
  }, [type, categoriesQuery.data]);

  const devices: Device[] = useMemo(
    () => (devicesQuery.data ?? []).filter((d) => d.userId === currentUserId),
    [devicesQuery.data, currentUserId],
  );

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const accepted: File[] = [];
    for (const f of picked) {
      if (!ACCEPTED_MIMES.has(f.type)) {
        toast.error(
          `${f.name}: unsupported file type. Allowed: mp3, mp4, png, jpg, pdf, wav`,
        );
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
    e.target.value = "";
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submitMutation = useMutation({
    mutationFn: async () => {
      setSubmitting(true);
      const ticket = await createTicket({
        type: type!,
        description: description.trim(),
        requesterId: currentUserId,
        category: category || undefined,
        deviceId: deviceId || undefined,
      });

      for (const file of files) {
        try {
          await createCommentWithAttachment(ticket.id, currentUserId, {
            type: "Public",
            file,
          });
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      return ticket;
    },
    onSuccess: (ticket) => {
      toast.success("Ticket created");
      navigate(`/user/tickets/${ticket.id}`);
    },
    onError: () => toast.error("Failed to create ticket"),
    onSettled: () => setSubmitting(false),
  });

  const canSubmit =
    type && category && description.trim().length > 5 && !submitting;

  return (
    <PageMotion>
      <div className="mx-auto max-w-[800px] p-4">
        <Link
          to="/user/tickets"
          className="mb-3 inline-flex items-center gap-1 text-[13px] text-[#2B9AE9] hover:underline"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to tickets
        </Link>

        {/* stepper */}
        <div className="mb-6 flex items-center gap-2 text-[13px] font-semibold text-[#8A8A8A]">
          {(
            [
              { key: "type", label: "1. Type", enabled: true },
              { key: "category", label: "2. Category", enabled: Boolean(type) },
              {
                key: "details",
                label: "3. Details",
                enabled: Boolean(type && category),
              },
            ] as { key: Step; label: string; enabled: boolean }[]
          ).map((s, i) => (
            <span key={s.key} className="flex items-center gap-2">
              {i > 0 && <span>›</span>}
              <button
                type="button"
                onClick={() => s.enabled && setStep(s.key)}
                disabled={!s.enabled}
                className={twMerge(
                  "transition",
                  step === s.key && "text-[#2B9AE9]",
                  s.enabled && step !== s.key && "cursor-pointer hover:text-[#3C3C3C] hover:underline",
                  !s.enabled && "cursor-not-allowed",
                )}
              >
                {s.label}
              </button>
            </span>
          ))}
        </div>

        {step === "type" && (
          <div className="rounded-[10px] bg-white p-6 shadow-xl">
            <h2 className="pb-1 text-[20px] font-bold text-[#3C3C3C]">
              What do you need help with?
            </h2>
            <p className="pb-4 text-[13px] text-[#8A8A8A]">
              Choose the type that best matches your issue.
            </p>
            <div className="flex flex-wrap gap-3">
              <TypeTile
                label="Incident"
                description="Something is broken or not working as expected."
                icon={faCircleExclamation}
                active={type === "Incident"}
                onClick={() => setType("Incident")}
              />
              <TypeTile
                label="Service request"
                description="You need something new installed, granted, or provided."
                icon={faWrench}
                active={type === "Service"}
                onClick={() => setType("Service")}
              />
            </div>
            <div className="flex justify-end pt-6">
              <ButtonPrimary
                text="Continue"
                color="blue"
                disabled={!type}
                onClick={() => setStep("category")}
              />
            </div>
          </div>
        )}

        {step === "category" && (
          <div className="rounded-[10px] bg-white p-6 shadow-xl">
            <h2 className="pb-1 text-[20px] font-bold text-[#3C3C3C]">
              Pick a category
            </h2>
            <p className="pb-4 text-[13px] text-[#8A8A8A]">
              Categories help route your ticket to the right team.
            </p>
            {categoriesQuery.isLoading && (
              <div className="text-[#8A8A8A]">Loading categories…</div>
            )}
            {!categoriesQuery.isLoading && categories.length === 0 && (
              <div className="text-[#8A8A8A]">
                No categories available for this type.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={twMerge(
                    "cursor-pointer rounded-[10px] border px-4 py-2 text-[14px] font-semibold transition",
                    category === c
                      ? "border-[#2B9AE9] bg-[#EBF5FE] text-[#2B9AE9]"
                      : "border-[#E0E0E0] bg-white text-[#535353] hover:border-[#B5D9F5]",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => setStep("type")}
                className="rounded-[10px] px-4 py-2 text-[14px] font-semibold text-[#8A8A8A] hover:text-[#3C3C3C]"
              >
                Back
              </button>
              <ButtonPrimary
                text="Continue"
                color="blue"
                disabled={!category}
                onClick={() => setStep("details")}
              />
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="rounded-[10px] bg-white p-6 shadow-xl">
            <h2 className="pb-1 text-[20px] font-bold text-[#3C3C3C]">
              Describe the issue
            </h2>
            <p className="pb-4 text-[13px] text-[#8A8A8A]">
              Provide as much detail as possible — what happened, when, and any
              error messages.
            </p>

            <div className="mb-4 flex flex-wrap gap-2 text-[12px] text-[#8A8A8A]">
              <span className="rounded-full bg-[#F5F5F5] px-3 py-[2px] font-semibold text-[#535353]">
                {type === "Service" ? "Service request" : "Incident"}
              </span>
              <span className="rounded-full bg-[#EBF5FE] px-3 py-[2px] font-semibold text-[#2B9AE9]">
                {category}
              </span>
            </div>

            {/* Device picker */}
            <div className="pb-4">
              <div className="pb-2 text-[14px] font-bold text-[#3C3C3C]">
                Related device{" "}
                <span className="text-[12px] font-normal text-[#8A8A8A]">
                  (optional)
                </span>
              </div>
              {devicesQuery.isLoading && (
                <div className="text-[13px] text-[#8A8A8A]">
                  Loading your equipment…
                </div>
              )}
              {!devicesQuery.isLoading && devices.length === 0 && (
                <div className="text-[13px] text-[#8A8A8A]">
                  You have no equipment assigned.
                </div>
              )}
              {devices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDeviceId("")}
                    className={twMerge(
                      "min-w-[140px] rounded-[10px] border px-4 py-3 text-left text-[14px] font-semibold transition",
                      deviceId === ""
                        ? "border-[#2B9AE9] bg-[#EBF5FE] text-[#2B9AE9]"
                        : "border-[#E0E0E0] bg-white text-[#535353] hover:border-[#B5D9F5]",
                    )}
                  >
                    None
                  </button>
                  {devices.map((d) => (
                    <DeviceTile
                      key={d.id}
                      device={d}
                      active={deviceId === d.id}
                      onClick={() => setDeviceId(d.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Describe your issue…"
              className="w-full resize-none rounded-[10px] border border-[#E0E0E0] p-3 text-[14px] outline-none focus:border-[#2B9AE9]"
            />
            {description.trim().length > 0 && description.trim().length <= 5 && (
              <div className="pt-1 text-[12px] text-[#BC0E0E]">
                Please add a few more words.
              </div>
            )}

            {/* Attachments */}
            <div className="pt-4">
              <div className="pb-2 text-[14px] font-bold text-[#3C3C3C]">
                Attachments{" "}
                <span className="text-[12px] font-normal text-[#8A8A8A]">
                  (optional — images, PDF, audio, mp4)
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleFilePick}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-[#535353] px-4 py-2 text-[14px] font-bold text-[#535353] transition hover:bg-[#F0F0F0]"
              >
                <FontAwesomeIcon icon={faPaperclip} />
                Add files
              </button>

              {files.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between rounded-[8px] bg-[#F6F6F6] px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FontAwesomeIcon
                          icon={faPaperclip}
                          className="text-[#8A8A8A]"
                        />
                        <span className="truncate text-[13px] font-semibold text-[#3C3C3C]">
                          {f.name}
                        </span>
                        <span className="text-[12px] text-[#8A8A8A]">
                          {formatBytes(f.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-[#8A8A8A] hover:text-[#BC0E0E]"
                        aria-label={t("helpdesk.removeFile")}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => setStep("category")}
                className="rounded-[10px] px-4 py-2 text-[14px] font-semibold text-[#8A8A8A] hover:text-[#3C3C3C]"
              >
                Back
              </button>
              <ButtonPrimary
                icon={faCheck}
                text={submitting ? "Creating…" : "Create ticket"}
                color="blue"
                disabled={!canSubmit}
                onClick={() => submitMutation.mutate()}
              />
            </div>
          </div>
        )}
      </div>
    </PageMotion>
  );
};

export default NewTicket;
