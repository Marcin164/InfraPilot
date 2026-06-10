import { useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { faWindows as faWindowsBrand } from "@fortawesome/free-brands-svg-icons";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Modal from "../../../../Components/Modals/AnimatedModal";
import { getAgentSetupInfo, rotateAgentToken } from "../../../../Services/devices";

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

const WindowsAgent = () => {
  const queryClient = useQueryClient();
  const [rotateModalOpen, setRotateModalOpen] = useState(false);

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

  if (isLoading) {
    return <div className="p-4 text-[#7a7a7a]">Loading...</div>;
  }
  if (isError) {
    return (
      <div className="p-4 bg-white rounded-[10px] shadow-xl">
        <CardHeader text="Windows Agent setup" icon={faTriangleExclamation} />
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
        <CardHeader text="Windows Agent setup" icon={faWindowsBrand} />
        <p className="text-[14px] text-[#535353] mt-2">
          Install the InfraPilot agent on a Windows host to start collecting
          inventory. The agent self-enrolls against this backend — no manual
          device creation needed. Each scan signs its request with a per-host
          HMAC-SHA256 secret.
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
              Token floty — używany przy pierwszej rejestracji agenta. Każde
              urządzenie po rejestracji otrzymuje własny sekret HMAC.
            </p>
            {data?.configured && (
              <div className="mb-3">
                <CopyableBox value={data.enrollmentToken} />
              </div>
            )}
            <ButtonPrimary
              text="Rotuj token"
              icon={faRotate}
              onClick={() => setRotateModalOpen(true)}
            />
            <p className="text-[12px] text-[#7a7a7a] mt-2">
              Rotacja unieważnia stary token. Już zarejestrowane urządzenia
              działają normalnie — nowy token potrzebny tylko przy instalacji
              kolejnych hostów.
            </p>
          </>
        )}
      </div>

      {data?.configured && data.powershellSnippet && (
        <div className="bg-white rounded-[10px] shadow-xl p-4">
          <CardHeader text="Instalacja na hoście" icon={faWindowsBrand} />
          <p className="text-[14px] text-[#535353] mt-2 mb-3">
            Na hoście Windows otwórz{" "}
            <strong>PowerShell jako Administrator</strong> i wklej:
          </p>
          <CopyableBox value={data.powershellSnippet} />
          <p className="text-[12px] text-[#7a7a7a] mt-2">
            Skrypt pobiera instalator z backendu i uruchamia go w trybie
            cichym z adresem URL i tokenem rejestracji.
          </p>
        </div>
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
