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
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../../../../Components/Modals/AnimatedModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getZoomConfig,
  saveZoomConfig,
  deleteZoomConfig,
  testZoomConnection,
} from "../../../../Services/zoom";

const emptyForm = { accountId: "", clientId: "", clientSecret: "" };

const ZoomConfigModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configQuery = useQuery({ queryKey: ["zoom-config"], queryFn: getZoomConfig, enabled: isOpen });
  const isConnected = !!configQuery.data?.accountId && configQuery.data.hasSecret;

  useEffect(() => {
    if (configQuery.data) {
      setForm({ accountId: configQuery.data.accountId ?? "", clientId: configQuery.data.clientId ?? "", clientSecret: "" });
    }
  }, [configQuery.data]);

  const field = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTestResult(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["zoom-config"] });
    queryClient.invalidateQueries({ queryKey: ["zoom-sync-status"] });
  };

  const saveMutation = useMutation({
    mutationFn: saveZoomConfig,
    onSuccess: (data) => {
      invalidateAll();
      toast.success(data.message || t("zoom.saved"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("zoom.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteZoomConfig,
    onSuccess: (data) => {
      invalidateAll();
      setForm(emptyForm);
      setTestResult(null);
      toast.success(data.message || t("zoom.deleted"));
    },
  });

  const testMutation = useMutation({ mutationFn: testZoomConnection, onSuccess: (d) => setTestResult(d) });

  const isLoading = saveMutation.isPending || deleteMutation.isPending || testMutation.isPending;

  const handleSave = () => {
    saveMutation.mutate({
      accountId: form.accountId,
      clientId: form.clientId,
      clientSecret: form.clientSecret || undefined,
    });
  };

  return (
    <Modal classNames={{ modal: "w-[520px] max-w-[95vw] rounded-[10px]" }} open={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-[18px]">
          <FontAwesomeIcon icon={faVideo} className="text-[#2D8CFF]" />
          {t("zoom.title")}
        </div>
        <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="text-[13px] text-[#7a7a7a] mb-4">{t("zoom.description")}</div>

      {isConnected && (
        <div className="flex items-center gap-2 mb-4 text-[14px] font-medium text-green-600">
          <FontAwesomeIcon icon={faCircleCheck} />
          {t("zoom.connectedAs", { accountId: configQuery.data?.accountId })}
        </div>
      )}

      <Input label={t("zoom.accountId")} name="accountId" value={form.accountId} handleChange={field("accountId")} placeholder="xxxxxxxxxxxxxxxxxxxx" />
      <Input label={t("zoom.clientId")} name="clientId" value={form.clientId} handleChange={field("clientId")} placeholder="xxxxxxxxxxxxxxxxxxxx" />
      <Input label={isConnected ? t("zoom.clientSecretKeep") : t("zoom.clientSecret")} name="clientSecret" type="password" value={form.clientSecret} handleChange={field("clientSecret")} placeholder="••••••••••••••••••••" />

      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-[12px] text-blue-700">
        {t("zoom.setupHint")}
      </div>

      {testResult && (
        <div className={`mt-4 flex items-center gap-2 text-[14px] font-medium ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
          <FontAwesomeIcon icon={testResult.ok ? faCircleCheck : faCircleXmark} />
          {testResult.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-5">
        <ButtonPrimary text={saveMutation.isPending ? t("common.saving") : t("common.save")} icon={saveMutation.isPending ? faSpinner : faKey} onClick={handleSave} disabled={!form.accountId || !form.clientId || isLoading} />
        <ButtonPrimary text={testMutation.isPending ? t("zoom.testing") : t("zoom.testConnection")} icon={testMutation.isPending ? faSpinner : faVial} onClick={() => testMutation.mutate()} disabled={!isConnected || isLoading} />
        {isConnected && (
          <ButtonPrimary text={deleteMutation.isPending ? `${t("common.delete")}...` : t("zoom.deleteConfig")} icon={faTrash} className="bg-[#F3606E] hover:bg-[#e04e5c]" onClick={() => setConfirmOpen(true)} disabled={isLoading} />
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

export default ZoomConfigModal;
