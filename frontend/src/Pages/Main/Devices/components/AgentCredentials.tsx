import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faRotateRight,
  faBan,
  faCopy,
  faTriangleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import {
  rotateAgentSecret,
  revokeAgentSecret,
} from "../../../../Services/devices";
import { getUser } from "../../../../Services/users";

type Props = {
  deviceId: string;
  lastScanAt?: string | null;
  apiSecretRotatedAt?: string | null;
  apiSecretPrevValidUntil?: string | null;
};

const AgentCredentials = ({
  deviceId,
  lastScanAt,
  apiSecretRotatedAt,
  apiSecretPrevValidUntil,
}: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const rotateMutation = useMutation({
    mutationFn: () => rotateAgentSecret(deviceId),
    onSuccess: ({ secret }) => {
      setGeneratedSecret(secret);
      queryClient.invalidateQueries({ queryKey: ["device"] });
      toast.success(
        "New secret generated — copy it now, it won't be shown again.",
      );
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to rotate secret"),
  });

  const revokeMutation = useMutation({
    mutationFn: () => revokeAgentSecret(deviceId),
    onSuccess: () => {
      setGeneratedSecret(null);
      queryClient.invalidateQueries({ queryKey: ["device"] });
      toast.success("Secret revoked. Agent will no longer be accepted.");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to revoke secret"),
  });

  if (!currentUserQuery.data?.isAdmin) return null;

  const copySecret = async () => {
    if (!generatedSecret) return;
    try {
      await navigator.clipboard.writeText(generatedSecret);
      toast.success("Secret copied to clipboard");
    } catch {
      toast.error("Clipboard not available");
    }
  };

  const prevStillValid =
    apiSecretPrevValidUntil &&
    new Date(apiSecretPrevValidUntil).getTime() > Date.now();

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.agentCredentials")} icon={faKey} />

      <div className="mt-3 text-[14px] text-[#535353] space-y-1">
        <div className="flex items-center gap-2">
          {lastScanAt ? (
            <FontAwesomeIcon icon={faCircleCheck} className="text-[#22C55E]" />
          ) : (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="text-[#F59E0B]"
            />
          )}
          <span>
            Last agent scan:{" "}
            <span className="font-bold">
              {lastScanAt
                ? moment(lastScanAt).format("DD MMMM YYYY, HH:mm:ss")
                : "never"}
            </span>
          </span>
        </div>
        <div className="text-[12px] text-[#7a7a7a]">
          Rotated:{" "}
          {apiSecretRotatedAt
            ? moment(apiSecretRotatedAt).format("DD MMMM YYYY, HH:mm:ss")
            : "never"}
        </div>
        {prevStillValid && (
          <div className="text-[12px] text-[#F59E0B]">
            Previous secret still accepted until{" "}
            {moment(apiSecretPrevValidUntil!).format("DD MMMM YYYY, HH:mm:ss")}{" "}
            (rollout grace).
          </div>
        )}
      </div>

      {generatedSecret && (
        <div className="mt-4 border border-[#F59E0B] bg-[#FFFBEB] rounded-[8px] p-3">
          <div className="flex items-center gap-2 text-[13px] text-[#92400E] font-bold mb-2">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            Save this secret now — it cannot be retrieved later.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all text-[12px] bg-white border border-[#E6E6E6] rounded-[6px] px-2 py-2">
              {generatedSecret}
            </code>
            <button
              type="button"
              onClick={copySecret}
              className="bg-[#2B9AE9] text-white text-[12px] rounded-[6px] px-3 py-2 cursor-pointer flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faCopy} />
              Copy
            </button>
          </div>
          <p className="text-[11px] text-[#7a7a7a] mt-2">
            Configure the agent with header <code>X-Device-Id: {deviceId}</code>{" "}
            and HMAC-SHA256 signature using this secret.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => askConfirm(() => rotateMutation.mutate(), "Generate a new agent secret? The previous one stays valid for 24h to allow a smooth rollout.")}
          disabled={rotateMutation.isPending}
          className="bg-[#2B9AE9] text-white text-[13px] rounded-[8px] px-3 py-2 cursor-pointer flex items-center gap-2 disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faRotateRight} />
          {rotateMutation.isPending ? "Generating…" : "Generate new secret"}
        </button>
        <button
          type="button"
          onClick={() => askConfirm(() => revokeMutation.mutate(), "Revoke the agent secret immediately? The agent will be unable to send scans until a new secret is generated and configured.")}
          disabled={revokeMutation.isPending}
          className="bg-[#F3606E] text-white text-[13px] rounded-[8px] px-3 py-2 cursor-pointer flex items-center gap-2 disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faBan} />
          {revokeMutation.isPending ? "Revoking…" : "Revoke"}
        </button>
      </div>
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
      />
    </div>
  );
};

export default AgentCredentials;
