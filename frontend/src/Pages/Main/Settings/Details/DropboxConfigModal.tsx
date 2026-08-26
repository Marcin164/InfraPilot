import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faSpinner,
  faTrash,
  faVial,
  faKey,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faDropbox } from "@fortawesome/free-brands-svg-icons";
import Modal from "../../../../Components/Modals/AnimatedModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getDropboxConfig,
  saveDropboxConfig,
  deleteDropboxConfig,
  testDropboxConnection,
} from "../../../../Services/dropbox";

const emptyForm = { appKey: "", appSecret: "", refreshToken: "" };

const DropboxConfigModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configQuery = useQuery({ queryKey: ["dropbox-config"], queryFn: getDropboxConfig, enabled: isOpen });
  const isConnected = !!configQuery.data?.appKey && configQuery.data.hasSecret && configQuery.data.hasRefreshToken;

  useEffect(() => {
    if (configQuery.data) {
      setForm({ appKey: configQuery.data.appKey ?? "", appSecret: "", refreshToken: "" });
    }
  }, [configQuery.data]);

  const field = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTestResult(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["dropbox-config"] });
    queryClient.invalidateQueries({ queryKey: ["dropbox-sync-status"] });
  };

  const saveMutation = useMutation({
    mutationFn: saveDropboxConfig,
    onSuccess: (data) => {
      invalidateAll();
      toast.success(data.message || t("dropbox.saved"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("dropbox.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDropboxConfig,
    onSuccess: (data) => {
      invalidateAll();
      setForm(emptyForm);
      setTestResult(null);
      toast.success(data.message || t("dropbox.deleted"));
    },
  });

  const testMutation = useMutation({ mutationFn: testDropboxConnection, onSuccess: (d) => setTestResult(d) });

  const isLoading = saveMutation.isPending || deleteMutation.isPending || testMutation.isPending;

  const handleSave = () => {
    saveMutation.mutate({
      appKey: form.appKey,
      appSecret: form.appSecret || undefined,
      refreshToken: form.refreshToken || undefined,
    });
  };

  return (
    <Modal classNames={{ modal: "w-[560px] max-w-[95vw] rounded-[10px]" }} open={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-[18px]">
          <FontAwesomeIcon icon={faDropbox} className="text-[#0061FF]" />
          {t("dropbox.title")}
        </div>
        <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="text-[13px] text-[#7a7a7a] mb-4">{t("dropbox.description")}</div>

      {isConnected && (
        <div className="flex items-center gap-2 mb-4 text-[14px] font-medium text-green-600">
          <FontAwesomeIcon icon={faCircleCheck} />
          {t("dropbox.connected")}
        </div>
      )}

      <Input label={t("dropbox.appKey")} name="appKey" value={form.appKey} handleChange={field("appKey")} placeholder="xxxxxxxxxxxxxxx" />
      <Input label={isConnected ? t("dropbox.appSecretKeep") : t("dropbox.appSecret")} name="appSecret" type="password" value={form.appSecret} handleChange={field("appSecret")} placeholder="••••••••••••••••••••" />
      <Input label={isConnected ? t("dropbox.refreshTokenKeep") : t("dropbox.refreshToken")} name="refreshToken" type="password" value={form.refreshToken} handleChange={field("refreshToken")} placeholder="••••••••••••••••••••" />

      <details className="mt-4 text-[13px]">
        <summary className="cursor-pointer font-semibold text-[#3C3C3C]">{t("dropbox.setupTitle")}</summary>
        <ol className="mt-2 space-y-1.5 text-[#3C3C3C] list-decimal list-inside">
          <li>{t("dropbox.setupStep1")}</li>
          <li>{t("dropbox.setupStep2")}</li>
          <li>{t("dropbox.setupStep3")}</li>
          <li>{t("dropbox.setupStep4")}</li>
          <li>{t("dropbox.setupStep5")}</li>
        </ol>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-blue-700">
          {t("dropbox.setupHint")}
        </div>
      </details>

      {testResult && (
        <div className={`mt-4 flex items-center gap-2 text-[14px] font-medium ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
          <FontAwesomeIcon icon={testResult.ok ? faCircleCheck : faCircleXmark} />
          {testResult.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-5">
        <ButtonPrimary text={saveMutation.isPending ? t("common.saving") : t("common.save")} icon={saveMutation.isPending ? faSpinner : faKey} onClick={handleSave} disabled={!form.appKey || isLoading} />
        <ButtonPrimary text={testMutation.isPending ? t("dropbox.testing") : t("dropbox.testConnection")} icon={testMutation.isPending ? faSpinner : faVial} onClick={() => testMutation.mutate()} disabled={!isConnected || isLoading} />
        {isConnected && (
          <ButtonPrimary text={deleteMutation.isPending ? `${t("common.delete")}...` : t("dropbox.deleteConfig")} icon={faTrash} className="bg-[#F3606E] hover:bg-[#e04e5c]" onClick={() => setConfirmOpen(true)} disabled={isLoading} />
        )}
      </div>

      <ConfirmationModal
        isModalOpen={confirmOpen}
        handleOnClose={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
        onDelete={() => { deleteMutation.mutate(); setConfirmOpen(false); }}
      />
    </Modal>
  );
};

export default DropboxConfigModal;
