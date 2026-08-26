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
  faPalette,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../../../../Components/Modals/AnimatedModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getAdobeConfig,
  saveAdobeConfig,
  deleteAdobeConfig,
  testAdobeConnection,
  type TrackedProfile,
} from "../../../../Services/adobe";

const emptyForm = { orgId: "", clientId: "", clientSecret: "" };

const AdobeConfigModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [profiles, setProfiles] = useState<TrackedProfile[]>([]);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configQuery = useQuery({ queryKey: ["adobe-config"], queryFn: getAdobeConfig, enabled: isOpen });
  const isConnected = !!configQuery.data?.orgId && configQuery.data.hasSecret;

  useEffect(() => {
    if (configQuery.data) {
      setForm({ orgId: configQuery.data.orgId ?? "", clientId: configQuery.data.clientId ?? "", clientSecret: "" });
      setProfiles(configQuery.data.profiles ?? []);
    }
  }, [configQuery.data]);

  const field = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTestResult(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["adobe-config"] });
    queryClient.invalidateQueries({ queryKey: ["adobe-sync-status"] });
  };

  const saveMutation = useMutation({
    mutationFn: saveAdobeConfig,
    onSuccess: (data) => {
      invalidateAll();
      toast.success(data.message || t("adobe.saved"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("adobe.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdobeConfig,
    onSuccess: (data) => {
      invalidateAll();
      setForm(emptyForm);
      setProfiles([]);
      setTestResult(null);
      toast.success(data.message || t("adobe.deleted"));
    },
  });

  const testMutation = useMutation({ mutationFn: testAdobeConnection, onSuccess: (d) => setTestResult(d) });

  const isLoading = saveMutation.isPending || deleteMutation.isPending || testMutation.isPending;

  const updateProfile = (index: number, patch: Partial<TrackedProfile>) =>
    setProfiles((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const removeProfile = (index: number) => setProfiles((prev) => prev.filter((_, i) => i !== index));

  const addProfile = () => setProfiles((prev) => [...prev, { groupName: "", displayName: "" }]);

  const handleSave = () => {
    saveMutation.mutate({
      orgId: form.orgId,
      clientId: form.clientId,
      clientSecret: form.clientSecret || undefined,
      profiles: profiles.filter((p) => p.groupName.trim()),
    });
  };

  return (
    <Modal classNames={{ modal: "w-[640px] max-w-[95vw] rounded-[10px]" }} open={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-[18px]">
          <FontAwesomeIcon icon={faPalette} className="text-[#FA0F00]" />
          {t("adobe.title")}
        </div>
        <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="text-[13px] text-[#7a7a7a] mb-4">{t("adobe.description")}</div>

      {isConnected && (
        <div className="flex items-center gap-2 mb-4 text-[14px] font-medium text-green-600">
          <FontAwesomeIcon icon={faCircleCheck} />
          {t("adobe.connectedAs", { orgId: configQuery.data?.orgId })}
        </div>
      )}

      <Input label={t("adobe.orgId")} name="orgId" value={form.orgId} handleChange={field("orgId")} placeholder="xxxxxxxxxxxxxxxxxxxxxxxx@AdobeOrg" />
      <Input label={t("adobe.clientId")} name="clientId" value={form.clientId} handleChange={field("clientId")} placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
      <Input label={isConnected ? t("adobe.clientSecretKeep") : t("adobe.clientSecret")} name="clientSecret" type="password" value={form.clientSecret} handleChange={field("clientSecret")} placeholder="••••••••••••••••••••" />

      {/* ─── Tracked Product Profiles ───────────────────────────────────── */}
      <div className="mt-5">
        <label className="font-bold text-[#3C3C3C]">{t("adobe.profilesTitle")}</label>
        <div className="text-[12px] text-[#7a7a7a] mb-3">{t("adobe.profilesDescription")}</div>

        {profiles.length === 0 && (
          <div className="text-[13px] text-[#9a9a9a] mb-3">{t("adobe.noProfiles")}</div>
        )}

        <div className="flex flex-col gap-3">
          {profiles.map((profile, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end border border-[#F0F0F0] rounded-[8px] p-3">
              <Input label={t("adobe.groupName")} value={profile.groupName} handleChange={(v: string) => updateProfile(i, { groupName: v })} placeholder="All Apps - Marketing" />
              <Input label={t("adobe.displayName")} value={profile.displayName ?? ""} handleChange={(v: string) => updateProfile(i, { displayName: v })} placeholder="Creative Cloud — Marketing" />
              <button
                onClick={() => removeProfile(i)}
                className="h-[42px] px-3 rounded-[8px] text-[#F3606E] hover:bg-[#FDEDEE] transition-colors"
                title={t("common.delete")}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>

        <ButtonPrimary color="white" text={t("adobe.addProfile")} icon={faPlus} onClick={addProfile} className="mt-3" />
      </div>

      <details className="mt-5 text-[13px]">
        <summary className="cursor-pointer font-semibold text-[#3C3C3C]">{t("adobe.setupTitle")}</summary>
        <ol className="mt-2 space-y-1.5 text-[#3C3C3C] list-decimal list-inside">
          <li>{t("adobe.setupStep1")}</li>
          <li>{t("adobe.setupStep2")}</li>
          <li>{t("adobe.setupStep3")}</li>
          <li>{t("adobe.setupStep4")}</li>
        </ol>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-blue-700">
          {t("adobe.setupHint")}
        </div>
      </details>

      {testResult && (
        <div className={`mt-4 flex items-center gap-2 text-[14px] font-medium ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
          <FontAwesomeIcon icon={testResult.ok ? faCircleCheck : faCircleXmark} />
          {testResult.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-5">
        <ButtonPrimary text={saveMutation.isPending ? t("common.saving") : t("common.save")} icon={saveMutation.isPending ? faSpinner : faKey} onClick={handleSave} disabled={!form.orgId || !form.clientId || isLoading} />
        <ButtonPrimary text={testMutation.isPending ? t("adobe.testing") : t("adobe.testConnection")} icon={testMutation.isPending ? faSpinner : faVial} onClick={() => testMutation.mutate()} disabled={!isConnected || isLoading} />
        {isConnected && (
          <ButtonPrimary text={deleteMutation.isPending ? `${t("common.delete")}...` : t("adobe.deleteConfig")} icon={faTrash} className="bg-[#F3606E] hover:bg-[#e04e5c]" onClick={() => setConfirmOpen(true)} disabled={isLoading} />
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

export default AdobeConfigModal;
