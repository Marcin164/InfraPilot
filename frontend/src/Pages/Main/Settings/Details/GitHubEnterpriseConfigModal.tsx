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
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Modal from "../../../../Components/Modals/AnimatedModal";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getGithubConfig,
  saveGithubConfig,
  deleteGithubConfig,
  testGithubConnection,
} from "../../../../Services/githubEnterprise";

const emptyForm = { enterpriseSlug: "", token: "" };

const GitHubEnterpriseConfigModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configQuery = useQuery({ queryKey: ["github-config"], queryFn: getGithubConfig, enabled: isOpen });
  const isConnected = !!configQuery.data?.enterpriseSlug && configQuery.data.hasToken;

  useEffect(() => {
    if (configQuery.data) {
      setForm({ enterpriseSlug: configQuery.data.enterpriseSlug ?? "", token: "" });
    }
  }, [configQuery.data]);

  const field = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTestResult(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["github-config"] });
    queryClient.invalidateQueries({ queryKey: ["github-sync-status"] });
  };

  const saveMutation = useMutation({
    mutationFn: saveGithubConfig,
    onSuccess: (data) => {
      invalidateAll();
      toast.success(data.message || t("githubEnterprise.saved"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("githubEnterprise.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGithubConfig,
    onSuccess: (data) => {
      invalidateAll();
      setForm(emptyForm);
      setTestResult(null);
      toast.success(data.message || t("githubEnterprise.deleted"));
    },
  });

  const testMutation = useMutation({ mutationFn: testGithubConnection, onSuccess: (d) => setTestResult(d) });

  const isLoading = saveMutation.isPending || deleteMutation.isPending || testMutation.isPending;

  const handleSave = () => {
    saveMutation.mutate({ enterpriseSlug: form.enterpriseSlug, token: form.token || undefined });
  };

  return (
    <Modal classNames={{ modal: "w-[520px] max-w-[95vw] rounded-[10px]" }} open={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-[18px]">
          <FontAwesomeIcon icon={faGithub} />
          {t("githubEnterprise.title")}
        </div>
        <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#3C3C3C]">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="text-[13px] text-[#7a7a7a] mb-4">{t("githubEnterprise.description")}</div>

      {isConnected && (
        <div className="flex items-center gap-2 mb-4 text-[14px] font-medium text-green-600">
          <FontAwesomeIcon icon={faCircleCheck} />
          {t("githubEnterprise.connectedAs", { slug: configQuery.data?.enterpriseSlug })}
        </div>
      )}

      <Input label={t("githubEnterprise.enterpriseSlug")} name="enterpriseSlug" value={form.enterpriseSlug} handleChange={field("enterpriseSlug")} placeholder="my-enterprise" />
      <Input label={isConnected ? t("githubEnterprise.tokenKeep") : t("githubEnterprise.token")} name="token" type="password" value={form.token} handleChange={field("token")} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />

      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-[12px] text-blue-700">
        {t("githubEnterprise.tokenHint")}
      </div>

      {testResult && (
        <div className={`mt-4 flex items-center gap-2 text-[14px] font-medium ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
          <FontAwesomeIcon icon={testResult.ok ? faCircleCheck : faCircleXmark} />
          {testResult.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-5">
        <ButtonPrimary text={saveMutation.isPending ? t("common.saving") : t("common.save")} icon={saveMutation.isPending ? faSpinner : faKey} onClick={handleSave} disabled={!form.enterpriseSlug || isLoading} />
        <ButtonPrimary text={testMutation.isPending ? t("githubEnterprise.testing") : t("githubEnterprise.testConnection")} icon={testMutation.isPending ? faSpinner : faVial} onClick={() => testMutation.mutate()} disabled={!isConnected || isLoading} />
        {isConnected && (
          <ButtonPrimary text={deleteMutation.isPending ? `${t("common.delete")}...` : t("githubEnterprise.deleteConfig")} icon={faTrash} className="bg-[#F3606E] hover:bg-[#e04e5c]" onClick={() => setConfirmOpen(true)} disabled={isLoading} />
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

export default GitHubEnterpriseConfigModal;
