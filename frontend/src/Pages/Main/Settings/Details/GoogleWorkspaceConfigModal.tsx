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
  faPlus,
  faKey,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import Modal from "../../../../Components/Modals/AnimatedModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getGoogleWorkspaceConfig,
  saveGoogleWorkspaceConfig,
  deleteGoogleWorkspaceConfig,
  testGoogleWorkspaceConnection,
  type TrackedSku,
} from "../../../../Services/googleWorkspace";

const emptyForm = { adminEmail: "", serviceAccountJson: "" };

const GoogleWorkspaceConfigModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [skus, setSkus] = useState<TrackedSku[]>([]);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configQuery = useQuery({ queryKey: ["google-config"], queryFn: getGoogleWorkspaceConfig, enabled: isOpen });
  const isConnected = !!configQuery.data?.adminEmail && configQuery.data.hasServiceAccount;

  useEffect(() => {
    if (configQuery.data) {
      setForm({ adminEmail: configQuery.data.adminEmail ?? "", serviceAccountJson: "" });
      setSkus(configQuery.data.skus ?? []);
    }
  }, [configQuery.data]);

  const field = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTestResult(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["google-config"] });
    queryClient.invalidateQueries({ queryKey: ["google-sync-status"] });
  };

  const saveMutation = useMutation({
    mutationFn: saveGoogleWorkspaceConfig,
    onSuccess: (data) => {
      invalidateAll();
      toast.success(data.message || t("googleWorkspace.saved"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("googleWorkspace.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoogleWorkspaceConfig,
    onSuccess: (data) => {
      invalidateAll();
      setForm(emptyForm);
      setSkus([]);
      setTestResult(null);
      toast.success(data.message || t("googleWorkspace.deleted"));
    },
  });

  const testMutation = useMutation({ mutationFn: testGoogleWorkspaceConnection, onSuccess: (d) => setTestResult(d) });

  const isLoading = saveMutation.isPending || deleteMutation.isPending || testMutation.isPending;

  const updateSku = (index: number, patch: Partial<TrackedSku>) =>
    setSkus((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const removeSku = (index: number) => setSkus((prev) => prev.filter((_, i) => i !== index));

  const addSku = () => setSkus((prev) => [...prev, { productId: "", skuId: "", displayName: "" }]);

  const handleSave = () => {
    saveMutation.mutate({
      adminEmail: form.adminEmail,
      serviceAccountJson: form.serviceAccountJson || undefined,
      skus: skus.filter((s) => s.productId.trim() && s.skuId.trim()),
    });
  };

  return (
    <Modal classNames={{ modal: "w-[640px] max-w-[95vw] rounded-[10px]" }} open={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-[18px]">
          <FontAwesomeIcon icon={faGoogle} className="text-[#2B9AE9]" />
          {t("googleWorkspace.title")}
        </div>
        <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="text-[13px] text-[#7a7a7a] mb-4">{t("googleWorkspace.description")}</div>

      {isConnected && (
        <div className="flex items-center gap-2 mb-4 text-[14px] font-medium text-green-600">
          <FontAwesomeIcon icon={faCircleCheck} />
          {t("googleWorkspace.connectedAs", { email: configQuery.data?.adminEmail })}
        </div>
      )}

      <Input label={t("googleWorkspace.adminEmail")} name="adminEmail" value={form.adminEmail} handleChange={field("adminEmail")} placeholder="admin@example.com" />

      <div className="pt-2">
        <label className="font-bold text-[#3C3C3C]">
          {isConnected ? t("googleWorkspace.serviceAccountJsonKeep") : t("googleWorkspace.serviceAccountJson")}
        </label>
        <textarea
          rows={4}
          className="w-full mt-[6px] border border-[#535353] bg-white text-[13px] font-mono block rounded-[10px] px-3 py-2 resize-none"
          value={form.serviceAccountJson}
          placeholder='{"type": "service_account", "client_email": "...", "private_key": "..."}'
          onChange={(e) => field("serviceAccountJson")(e.target.value)}
        />
      </div>

      {/* ─── Tracked SKUs ───────────────────────────────────────────────── */}
      <div className="mt-5">
        <label className="font-bold text-[#3C3C3C]">{t("googleWorkspace.skusTitle")}</label>
        <div className="text-[12px] text-[#7a7a7a] mb-3">{t("googleWorkspace.skusDescription")}</div>

        {skus.length === 0 && (
          <div className="text-[13px] text-[#9a9a9a] mb-3">{t("googleWorkspace.noSkus")}</div>
        )}

        <div className="flex flex-col gap-3">
          {skus.map((sku, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end border border-[#F0F0F0] rounded-[8px] p-3">
              <Input label={t("googleWorkspace.productId")} value={sku.productId} handleChange={(v: string) => updateSku(i, { productId: v })} placeholder="Google-Apps" />
              <Input label={t("googleWorkspace.skuId")} value={sku.skuId} handleChange={(v: string) => updateSku(i, { skuId: v })} placeholder="1010020025" />
              <Input label={t("googleWorkspace.displayName")} value={sku.displayName ?? ""} handleChange={(v: string) => updateSku(i, { displayName: v })} placeholder="Business Standard" />
              <button
                onClick={() => removeSku(i)}
                className="h-[42px] px-3 rounded-[8px] text-[#F3606E] hover:bg-[#FDEDEE] transition-colors"
                title={t("common.delete")}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>

        <ButtonPrimary color="white" text={t("googleWorkspace.addSku")} icon={faPlus} onClick={addSku} className="mt-3" />
      </div>

      <details className="mt-5 text-[13px]">
        <summary className="cursor-pointer font-semibold text-[#3C3C3C]">{t("googleWorkspace.setupTitle")}</summary>
        <ol className="mt-2 space-y-1.5 text-[#3C3C3C] list-decimal list-inside">
          <li>{t("googleWorkspace.setupStep1")}</li>
          <li>{t("googleWorkspace.setupStep2")}</li>
          <li>{t("googleWorkspace.setupStep3")}</li>
          <li>{t("googleWorkspace.setupStep4")}</li>
          <li>{t("googleWorkspace.setupStep5")}</li>
        </ol>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-blue-700">
          {t("googleWorkspace.skuReferenceHint")}
        </div>
      </details>

      {testResult && (
        <div className={`mt-4 flex items-center gap-2 text-[14px] font-medium ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
          <FontAwesomeIcon icon={testResult.ok ? faCircleCheck : faCircleXmark} />
          {testResult.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-5">
        <ButtonPrimary text={saveMutation.isPending ? t("common.saving") : t("common.save")} icon={saveMutation.isPending ? faSpinner : faKey} onClick={handleSave} disabled={!form.adminEmail || isLoading} />
        <ButtonPrimary text={testMutation.isPending ? t("googleWorkspace.testing") : t("googleWorkspace.testConnection")} icon={testMutation.isPending ? faSpinner : faVial} onClick={() => testMutation.mutate()} disabled={!isConnected || isLoading} />
        {isConnected && (
          <ButtonPrimary text={deleteMutation.isPending ? `${t("common.delete")}...` : t("googleWorkspace.deleteConfig")} icon={faTrash} className="bg-[#F3606E] hover:bg-[#e04e5c]" onClick={() => setConfirmOpen(true)} disabled={isLoading} />
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

export default GoogleWorkspaceConfigModal;
