import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faKey,
  faTriangleExclamation,
  faTrash,
  faDownload,
  faUpload,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { faWindows as faWindowsBrand, faApple, faLinux } from "@fortawesome/free-brands-svg-icons";
import { twMerge } from "tailwind-merge";
import moment from "moment";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import Modal from "../../../../Components/Modals/AnimatedModal";
import {
  AgentPlatform,
  AgentPlatformSetupInfo,
  EnrollmentTokenSnippets,
  getAgentSetupInfo,
  listEnrollmentTokens,
  createEnrollmentToken,
  revokeEnrollmentToken,
  uploadAgentInstaller,
} from "../../../../Services/devices";

const CopyableBox = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };
  return (
    <div className="relative">
      <pre className="bg-[#1E1E1E] text-[#E6E6E6] text-[12px] rounded-[8px] p-3 overflow-x-auto whitespace-pre">
        {value}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 bg-[#2B9AE9] text-white text-[12px] rounded-[6px] px-3 py-1 cursor-pointer flex items-center gap-1"
      >
        <FontAwesomeIcon icon={faCopy} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const STATUS_PILL: Record<string, string> = {
  pending: "bg-[#FFFBEB] text-[#92400E]",
  used: "bg-[#EAFBF1] text-[#166534]",
  revoked: "bg-[#FDECEC] text-[#991B1B]",
  expired: "bg-[#F0F0F0] text-[#6B7280]",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Oczekuje",
  used: "Użyty",
  revoked: "Unieważniony",
  expired: "Wygasł",
};

const TTL_OPTIONS = [
  { label: "1 godzina", value: 1 },
  { label: "24 godziny", value: 24 },
  { label: "72 godziny", value: 72 },
  { label: "7 dni", value: 24 * 7 },
];

const PLATFORM_CONFIG: Record<
  AgentPlatform,
  { label: string; icon: any; accept: string; installCardTitle: string; installHint: string }
> = {
  windows: {
    label: "Windows",
    icon: faWindowsBrand,
    accept: ".exe",
    installCardTitle: "Instalacja na hoście",
    installHint: 'Na hoście Windows otwórz <strong>PowerShell jako Administrator</strong> i wklej:',
  },
  macos: {
    label: "macOS",
    icon: faApple,
    accept: ".pkg",
    installCardTitle: "Instalacja na hoście",
    installHint: "Na hoście macOS otwórz <strong>Terminal</strong> i wklej:",
  },
  linux: {
    label: "Linux",
    icon: faLinux,
    accept: ".deb",
    installCardTitle: "Instalacja na hoście",
    installHint: "Na hoście Linux otwórz <strong>terminal</strong> i wklej:",
  },
};

const AgentPlatformPanel = ({
  platform,
  data,
  onUpload,
  uploading,
}: {
  platform: AgentPlatform;
  data: AgentPlatformSetupInfo;
  onUpload: (file: File, signatureFile?: File) => void;
  uploading: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sigInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingSignature, setPendingSignature] = useState<File | null>(null);
  const cfg = PLATFORM_CONFIG[platform];

  return (
    <div className="bg-white rounded-[10px] shadow-xl p-4">
      <CardHeader text={`Instalator agenta (${cfg.label})`} icon={faDownload} />
      <p className="text-[14px] text-[#535353] mt-2 mb-3">
        Plik {cfg.accept} wgrany tutaj jest serwowany przez ten backend --
        nie trzeba hostować go nigdzie indziej. Snippet instalacyjny (adres +
        token) generujesz osobno w sekcji „Tokeny rejestracji" powyżej.
      </p>
      {data.installerMeta ? (
        <div className="bg-[#F5F7FA] rounded-[8px] p-3 text-[13px] text-[#3C3C3C] mb-3 flex items-center justify-between">
          <span>
            {data.installerMeta.originalName} ·{" "}
            {formatBytes(data.installerMeta.sizeBytes)}
            {platform === "linux" && (
              <span className={data.installerMeta.signature ? "text-[#166534]" : "text-[#92400E]"}>
                {" "}· {data.installerMeta.signature ? "podpisany" : "niepodpisany"}
              </span>
            )}
          </span>
          <a href={data.installerUrl ?? undefined} className="text-[#2B9AE9] font-semibold">
            Pobierz
          </a>
        </div>
      ) : (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-[8px] p-3 text-[#92400E] text-[14px] mb-3">
          Instalator nie został jeszcze wgrany. Wgraj plik {cfg.accept}, żeby
          wygenerowane tokeny mogły go pobrać.
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={cfg.accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file, pendingSignature ?? undefined);
          e.target.value = "";
          setPendingSignature(null);
        }}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <ButtonPrimary
          text={uploading ? "Wgrywanie..." : data.installerMeta ? "Wgraj nową wersję" : "Wgraj instalator"}
          icon={faUpload}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        />
        {platform === "linux" && (
          <>
            <input
              ref={sigInputRef}
              type="file"
              accept=".asc,.sig"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPendingSignature(file);
                e.target.value = "";
              }}
            />
            <ButtonPrimary
              color="white"
              text={pendingSignature ? `Podpis: ${pendingSignature.name}` : "Dołącz podpis (.sig)"}
              icon={faKey}
              onClick={() => sigInputRef.current?.click()}
              disabled={uploading}
            />
          </>
        )}
      </div>
      {platform === "linux" && pendingSignature && (
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          Podpis zostanie wysłany razem z następnym plikiem {cfg.accept} wybranym powyżej.
        </p>
      )}
    </div>
  );
};

const GenerateTokenModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [ttlHours, setTtlHours] = useState(24);
  const [result, setResult] = useState<EnrollmentTokenSnippets | null>(null);
  const [activePlatform, setActivePlatform] = useState<AgentPlatform>("windows");

  const generateMutation = useMutation({
    mutationFn: () => createEnrollmentToken({ label: label.trim() || undefined, ttlHours }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["enrollment-tokens"] });
    },
    onError: () => toast.error("Nie udało się wygenerować tokenu"),
  });

  const handleClose = () => {
    setLabel("");
    setTtlHours(24);
    setResult(null);
    setActivePlatform("windows");
    onClose();
  };

  return (
    <Modal
      classNames={{ modal: "w-[560px] h-fit rounded-[10px]" }}
      open={open}
      onClose={handleClose}
      center
    >
      <div className="text-center font-bold text-[22px] mb-4">
        {result ? "Token wygenerowany" : "Nowy token rejestracji"}
      </div>

      {!result ? (
        <>
          <div className="mb-3">
            <Input
              label="Etykieta (opcjonalnie)"
              placeholder="np. Laptopy magazyn — marzec"
              value={label}
              onChange={(e: any) => setLabel(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <SelectSecondary
              label="Ważność"
              options={TTL_OPTIONS}
              value={TTL_OPTIONS.find((o) => o.value === ttlHours)}
              onSelect={(opt: any) => setTtlHours(opt.value)}
            />
          </div>
          <div className="flex justify-around mt-2">
            <ButtonPrimary text="Anuluj" onClick={handleClose} />
            <ButtonPrimary
              icon={faKey}
              text={generateMutation.isPending ? "Generowanie..." : "Wygeneruj"}
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            />
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] text-[#535353] text-center mb-3">
            Wygasa {moment(result.expiresAt).format("DD/MM/YYYY, HH:mm")}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {(Object.keys(PLATFORM_CONFIG) as AgentPlatform[]).map((platform) => (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={twMerge(
                  "px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors flex items-center gap-2",
                  activePlatform === platform
                    ? "bg-[#2B9AE9] text-white"
                    : "bg-[#F5F7FA] text-[#3C3C3C] hover:bg-[#E8EEF4]",
                )}
              >
                <FontAwesomeIcon icon={PLATFORM_CONFIG[platform].icon} />
                {PLATFORM_CONFIG[platform].label}
              </button>
            ))}
          </div>
          {result[activePlatform].snippet ? (
            <div
              className="text-[13px] text-[#535353] mb-2"
              dangerouslySetInnerHTML={{ __html: PLATFORM_CONFIG[activePlatform].installHint }}
            />
          ) : (
            <p className="text-[13px] text-[#92400E] mb-2">
              Instalator dla {PLATFORM_CONFIG[activePlatform].label} nie został
              jeszcze wgrany — wgraj go w panelu poniżej, żeby snippet zadziałał.
            </p>
          )}
          {result[activePlatform].snippet && (
            <CopyableBox value={result[activePlatform].snippet as string} />
          )}
          {result.enrollmentToken && (
            <div className="mt-4 border border-[#E0E0E0] rounded-[8px] p-3 bg-[#F9FAFB]">
              <p className="text-[12px] font-semibold text-[#3C3C3C] mb-2">
                Ręczna konfiguracja (agent GUI — pole „Połącz z backendem"):
              </p>
              <div className="mb-2">
                <p className="text-[11px] text-[#7a7a7a] mb-1">Backend URL:</p>
                <CopyableBox value={result.backendUrl as string} />
              </div>
              <div>
                <p className="text-[11px] text-[#7a7a7a] mb-1">Token rejestracji:</p>
                <CopyableBox value={result.enrollmentToken as string} />
              </div>
            </div>
          )}
          <p className="text-[12px] text-[#BC0E0E] mt-3 text-center">
            ⚠ Token pokazany tylko raz. Zamknięcie tego okna = trzeba wygenerować nowy.
          </p>
          <div className="flex justify-center mt-3">
            <ButtonPrimary text="Zamknij" onClick={handleClose} />
          </div>
        </>
      )}
    </Modal>
  );
};

const EnrollmentTokensCard = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ["enrollment-tokens"],
    queryFn: listEnrollmentTokens,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeEnrollmentToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-tokens"] });
      toast.success("Token unieważniony");
    },
    onError: () => toast.error("Nie udało się unieważnić tokenu"),
  });

  return (
    <div className="bg-white rounded-[10px] shadow-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <CardHeader text="Tokeny rejestracji" icon={faKey} />
        <ButtonPrimary text="+ Nowy token" icon={faPlus} onClick={() => setModalOpen(true)} />
      </div>
      <p className="text-[14px] text-[#535353] mt-2 mb-3">
        Każda instalacja agenta (Windows, macOS, Linux) używa własnego,
        jednorazowego tokenu. Po rejestracji urządzenie dostaje własny sekret
        HMAC — token służy tylko do otwarcia furtki na pierwsze podłączenie.
      </p>

      {isLoading ? (
        <p className="text-[13px] text-[#7a7a7a]">Ładowanie...</p>
      ) : !tokens || tokens.length === 0 ? (
        <p className="text-[13px] text-[#7a7a7a]">
          Brak wygenerowanych tokenów. Kliknij „+ Nowy token", żeby zainstalować
          pierwszego agenta.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[#7a7a7a] text-[12px]">
                <th className="pb-2 pr-3">Etykieta</th>
                <th className="pb-2 pr-3">Utworzony</th>
                <th className="pb-2 pr-3">Wygasa</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Urządzenie</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id} className="border-t border-[#F0F0F0]">
                  <td className="py-2 pr-3">{t.label ?? "(bez etykiety)"}</td>
                  <td className="py-2 pr-3">{moment(t.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                  <td className="py-2 pr-3">{moment(t.expiresAt).format("DD/MM/YYYY HH:mm")}</td>
                  <td className="py-2 pr-3">
                    <span className={twMerge("rounded-full px-2 py-[2px] text-[11px] font-semibold", STATUS_PILL[t.displayStatus])}>
                      {STATUS_LABEL[t.displayStatus]}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{t.deviceId ?? "—"}</td>
                  <td className="py-2 text-right">
                    {t.displayStatus === "pending" && (
                      <button
                        onClick={() => revokeMutation.mutate(t.id)}
                        disabled={revokeMutation.isPending}
                        className="text-[#BC0E0E] hover:opacity-70 cursor-pointer"
                        title="Unieważnij"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GenerateTokenModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

const WindowsAgent = () => {
  const [activePlatform, setActivePlatform] = useState<AgentPlatform>("windows");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["agent-setup-info"],
    queryFn: getAgentSetupInfo,
  });

  const queryClient = useQueryClient();
  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      platform,
      signatureFile,
    }: {
      file: File;
      platform: AgentPlatform;
      signatureFile?: File;
    }) => uploadAgentInstaller(file, platform, signatureFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-setup-info"] });
      toast.success("Instalator agenta został wgrany");
    },
    onError: () => toast.error("Nie udało się wgrać instalatora"),
  });

  if (isLoading) {
    return <div className="p-4 text-[#7a7a7a]">Loading...</div>;
  }
  if (isError) {
    return (
      <div className="p-4 bg-white rounded-[10px] shadow-xl">
        <CardHeader text="Agent setup" icon={faTriangleExclamation} />
        <p className="text-[#BC0E0E] mt-2">
          {(error as any)?.response?.data?.message ??
            "You need the Admin role to view agent setup details."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text="Agent setup" icon={faWindowsBrand} />
        <p className="text-[14px] text-[#535353] mt-2">
          Install the InfraPilot agent on a Windows, macOS or Linux host to
          start collecting inventory. The agent self-enrolls against this
          backend — no manual device creation needed. Each scan signs its
          request with a per-host HMAC-SHA256 secret.
        </p>
      </div>

      <EnrollmentTokensCard />

      {data && (
        <>
          <div className="bg-white rounded-[10px] shadow-xl p-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PLATFORM_CONFIG) as AgentPlatform[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setActivePlatform(platform)}
                  className={twMerge(
                    "px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors flex items-center gap-2",
                    activePlatform === platform
                      ? "bg-[#2B9AE9] text-white"
                      : "bg-[#F5F7FA] text-[#3C3C3C] hover:bg-[#E8EEF4]",
                  )}
                >
                  <FontAwesomeIcon icon={PLATFORM_CONFIG[platform].icon} />
                  {PLATFORM_CONFIG[platform].label}
                </button>
              ))}
            </div>
          </div>

          <AgentPlatformPanel
            platform={activePlatform}
            data={data[activePlatform]}
            onUpload={(file, signatureFile) =>
              uploadMutation.mutate({ file, platform: activePlatform, signatureFile })
            }
            uploading={uploadMutation.isPending}
          />
        </>
      )}
    </div>
  );
};

export default WindowsAgent;
