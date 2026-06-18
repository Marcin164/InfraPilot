import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faKey,
  faTriangleExclamation,
  faRotate,
  faCircleCheck,
  faCircleXmark,
  faDownload,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { faWindows as faWindowsBrand, faApple } from "@fortawesome/free-brands-svg-icons";
import { twMerge } from "tailwind-merge";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Modal from "../../../../Components/Modals/AnimatedModal";
import {
  AgentPlatform,
  AgentPlatformSetupInfo,
  getAgentSetupInfo,
  rotateAgentToken,
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
};

const AgentPlatformPanel = ({
  platform,
  data,
  onUpload,
  uploading,
}: {
  platform: AgentPlatform;
  data: AgentPlatformSetupInfo;
  onUpload: (file: File) => void;
  uploading: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cfg = PLATFORM_CONFIG[platform];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text={`Instalator agenta (${cfg.label})`} icon={faDownload} />
        <p className="text-[14px] text-[#535353] mt-2 mb-3">
          Plik {cfg.accept} wgrany tutaj jest serwowany przez ten backend pod
          adresem widocznym poniżej w snippecie -- nie trzeba hostować go
          nigdzie indziej.
        </p>
        {data.installerMeta ? (
          <div className="bg-[#F5F7FA] rounded-[8px] p-3 text-[13px] text-[#3C3C3C] mb-3 flex items-center justify-between">
            <span>
              {data.installerMeta.originalName} ·{" "}
              {formatBytes(data.installerMeta.sizeBytes)}
            </span>
            <a href={data.installerUrl ?? undefined} className="text-[#2B9AE9] font-semibold">
              Pobierz
            </a>
          </div>
        ) : (
          <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-[8px] p-3 text-[#92400E] text-[14px] mb-3">
            Instalator nie został jeszcze wgrany. Wgraj plik {cfg.accept}, żeby
            snippet poniżej mógł go pobrać.
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={cfg.accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <ButtonPrimary
          text={uploading ? "Wgrywanie..." : data.installerMeta ? "Wgraj nową wersję" : "Wgraj instalator"}
          icon={faUpload}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        />
      </div>

      {data.snippet && (
        <div className="bg-white rounded-[10px] shadow-xl p-4">
          <CardHeader text={cfg.installCardTitle} icon={cfg.icon} />
          <p
            className="text-[14px] text-[#535353] mt-2 mb-3"
            dangerouslySetInnerHTML={{ __html: cfg.installHint }}
          />
          <CopyableBox value={data.snippet} />
          <p className="text-[12px] text-[#7a7a7a] mt-2">
            Skrypt pobiera instalator z backendu i uruchamia go w trybie
            cichym z adresem URL i tokenem rejestracji.
          </p>
        </div>
      )}
    </div>
  );
};

const WindowsAgent = () => {
  const queryClient = useQueryClient();
  const [rotateModalOpen, setRotateModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<AgentPlatform>("windows");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["agent-setup-info"],
    queryFn: getAgentSetupInfo,
  });

  const rotateMutation = useMutation({
    mutationFn: rotateAgentToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-setup-info"] });
      setRotateModalOpen(false);
      toast.success("Token został wygenerowany");
    },
    onError: () => toast.error("Nie udało się wygenerować tokenu"),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, platform }: { file: File; platform: AgentPlatform }) =>
      uploadAgentInstaller(file, platform),
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
          Install the InfraPilot agent on a Windows or macOS host to start
          collecting inventory. The agent self-enrolls against this backend —
          no manual device creation needed. Each scan signs its request with
          a per-host HMAC-SHA256 secret.
        </p>
      </div>

      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text="Token rejestracji" icon={faKey} />

        {data && !data.configured ? (
          <>
            <div className="mt-3 bg-[#FFFBEB] border border-[#F59E0B] rounded-[8px] p-3 text-[#92400E] text-[14px] mb-4">
              {data.message}
            </div>
            <ButtonPrimary
              text={rotateMutation.isPending ? "Generowanie..." : "Wygeneruj token"}
              icon={faKey}
              onClick={() => rotateMutation.mutate()}
              disabled={rotateMutation.isPending}
            />
          </>
        ) : (
          <>
            <p className="text-[14px] text-[#535353] mt-2 mb-3">
              Token floty — używany przy pierwszej rejestracji agenta (Windows
              i macOS). Każde urządzenie po rejestracji otrzymuje własny
              sekret HMAC.
            </p>
            {data?.configured && (
              <div className="mb-3">
                <CopyableBox value={data.enrollmentToken} />
              </div>
            )}
            <ButtonPrimary text="Rotuj token" icon={faRotate} onClick={() => setRotateModalOpen(true)} />
            <p className="text-[12px] text-[#7a7a7a] mt-2">
              Rotacja unieważnia stary token. Już zarejestrowane urządzenia
              działają normalnie — nowy token potrzebny tylko przy instalacji
              kolejnych hostów.
            </p>
          </>
        )}
      </div>

      {data?.configured && (
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
            onUpload={(file) => uploadMutation.mutate({ file, platform: activePlatform })}
            uploading={uploadMutation.isPending}
          />
        </>
      )}

      <Modal
        classNames={{ modal: "w-[480px] h-fit rounded-[10px]" }}
        open={rotateModalOpen}
        onClose={() => setRotateModalOpen(false)}
        center
      >
        <div className="text-center font-bold text-[22px] mb-4">
          Rotacja tokenu rejestracji
        </div>
        <div className="text-center py-4">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="text-[#F59E0B] text-[64px]"
          />
        </div>
        <p className="text-[16px] font-light text-justify pb-4">
          Stary token zostanie unieważniony. Nowe instalacje agenta będą
          wymagały nowego tokenu. Już zarejestrowane urządzenia{" "}
          <strong>nie stracą</strong> połączenia.
        </p>
        <div className="flex justify-around mt-2">
          <ButtonPrimary
            icon={faCircleXmark}
            text="Anuluj"
            onClick={() => setRotateModalOpen(false)}
          />
          <ButtonPrimary
            icon={rotateMutation.isPending ? faRotate : faCircleCheck}
            text={rotateMutation.isPending ? "Generowanie..." : "Wygeneruj nowy token"}
            onClick={() => rotateMutation.mutate()}
            disabled={rotateMutation.isPending}
          />
        </div>
      </Modal>
    </div>
  );
};

export default WindowsAgent;
