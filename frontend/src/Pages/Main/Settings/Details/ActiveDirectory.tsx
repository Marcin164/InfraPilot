import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlug,
  faPlugCircleXmark,
  faSync,
  faVial,
  faCircleCheck,
  faCircleXmark,
  faServer,
  faSpinner,
  faWarning,
  faXmark,
  faCertificate,
  faUpload,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Modal from "../../../../Components/Modals/AnimatedModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdStatus,
  connectAd,
  disconnectAd,
  testAdConnection,
  syncAdUsers,
  uploadAdCertificate,
  deleteAdCertificate,
  type AdConfig,
} from "../../../../Services/activeDirectory";

const ActiveDirectory = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const certInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<AdConfig>({
    url: "",
    baseDN: "",
    username: "",
    password: "",
  });

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState("");
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["ad-status"],
    queryFn: getAdStatus,
  });

  const connectMutation = useMutation({
    mutationFn: connectAd,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["ad-status"] });
        setForm({ url: "", baseDN: "", username: "", password: "" });
        setTestResult(null);
      }
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectAd,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["ad-status"] });
        setDisconnectModalOpen(false);
        setDisconnectPassword("");
        setDisconnectError(null);
      } else {
        setDisconnectError(data.message);
      }
    },
  });

  const testMutation = useMutation({
    mutationFn: testAdConnection,
    onSuccess: (data) => setTestResult(data),
  });

  const syncMutation = useMutation({
    mutationFn: syncAdUsers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-status"] });
    },
  });

  const certUploadMutation = useMutation({
    mutationFn: uploadAdCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-status"] });
    },
  });

  const certDeleteMutation = useMutation({
    mutationFn: deleteAdCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-status"] });
    },
  });

  const status = statusQuery.data;
  const isConnected = status?.connected ?? false;
  const isLoading =
    connectMutation.isPending ||
    disconnectMutation.isPending ||
    testMutation.isPending ||
    syncMutation.isPending;

  const handleFormChange = (field: keyof AdConfig) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const isFormValid = form.url && form.baseDN && form.username && form.password;

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) certUploadMutation.mutate(file);
    if (certInputRef.current) certInputRef.current.value = "";
  };

  return (
    <div className="m-4 space-y-4">
      {/* CONNECTION STATUS */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <h3 className="font-semibold mb-3 text-[18px]">
          <FontAwesomeIcon icon={faServer} className="mr-2" />
          Status połączenia
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-400"}`}
          />
          <span className="text-[16px] font-medium">
            {isConnected ? "Połączono" : "Brak połączenia"}
          </span>
        </div>

        {isConnected && status && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[14px] text-[#3C3C3C]">
            <div>
              <span className="font-semibold">Serwer LDAP:</span>{" "}
              <span className="text-[#535353]">{status.url}</span>
            </div>
            <div>
              <span className="font-semibold">Base DN:</span>{" "}
              <span className="text-[#535353]">{status.baseDN}</span>
            </div>
            <div>
              <span className="font-semibold">Ostatnia synchronizacja:</span>{" "}
              <span className="text-[#535353]">
                {status.lastSync
                  ? new Date(status.lastSync).toLocaleString("pl-PL")
                  : "Nigdy"}
              </span>
            </div>
            <div>
              <span className="font-semibold">
                Zsynchronizowani użytkownicy:
              </span>{" "}
              <span className="text-[#535353]">
                {status.lastSyncUsersCount ?? "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CERTIFICATE */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <h3 className="font-semibold mb-3 text-[18px]">
          <FontAwesomeIcon icon={faCertificate} className="mr-2" />
          Certyfikat CA (LDAPS)
        </h3>

        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-3 h-3 rounded-full ${status?.hasCertificate ? "bg-green-500" : "bg-red-400"}`}
          />
          <span className="text-[14px] font-medium">
            {status?.hasCertificate
              ? "Certyfikat załadowany"
              : "Brak certyfikatu — wymagany do połączenia LDAPS"}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={certInputRef}
            type="file"
            accept=".cer,.crt,.pem"
            className="hidden"
            onChange={handleCertUpload}
          />
          <ButtonPrimary
            text={
              certUploadMutation.isPending
                ? "Wysyłanie..."
                : status?.hasCertificate
                  ? "Zmień certyfikat"
                  : "Wgraj certyfikat"
            }
            icon={faUpload}
            onClick={() => certInputRef.current?.click()}
            disabled={certUploadMutation.isPending}
          />
          {status?.hasCertificate && (
            <ButtonPrimary
              text={t("settings.removeCertificate")}
              icon={faTrash}
              onClick={() => certDeleteMutation.mutate()}
              disabled={certDeleteMutation.isPending}
            />
          )}
        </div>

        {(certUploadMutation.data || certDeleteMutation.data) && (
          <div
            className={`mt-3 flex items-center gap-2 text-[14px] font-medium ${
              (certUploadMutation.data || certDeleteMutation.data)?.success
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            <FontAwesomeIcon
              icon={
                (certUploadMutation.data || certDeleteMutation.data)?.success
                  ? faCircleCheck
                  : faCircleXmark
              }
            />
            {(certUploadMutation.data || certDeleteMutation.data)?.message}
          </div>
        )}
      </div>

      {/* ACTIONS FOR CONNECTED STATE */}
      {isConnected && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <h3 className="font-semibold mb-3 text-[18px]">Akcje</h3>
          <div className="flex gap-3 flex-wrap">
            <ButtonPrimary
              text={
                syncMutation.isPending
                  ? "Synchronizacja..."
                  : "Synchronizuj użytkowników"
              }
              icon={syncMutation.isPending ? faSpinner : faSync}
              onClick={() => syncMutation.mutate()}
              disabled={isLoading}
            />
            <ButtonPrimary
              text={t("settings.disconnect")}
              icon={faPlugCircleXmark}
              onClick={() => setDisconnectModalOpen(true)}
              disabled={isLoading}
            />
          </div>

          {syncMutation.data && (
            <div
              className={`mt-3 flex items-center gap-2 text-[14px] font-medium ${
                syncMutation.data.success ? "text-green-600" : "text-red-600"
              }`}
            >
              <FontAwesomeIcon
                icon={syncMutation.data.success ? faCircleCheck : faCircleXmark}
              />
              {syncMutation.data.message}
            </div>
          )}
        </div>
      )}

      {/* DISCONNECT CONFIRMATION MODAL */}
      <Modal
        classNames={{ modal: "w-[500px] h-fit rounded-[10px]" }}
        open={disconnectModalOpen}
        onClose={() => {
          setDisconnectModalOpen(false);
          setDisconnectPassword("");
          setDisconnectError(null);
        }}
        center
      >
        <div className="text-center font-bold text-[24px]">
          Rozłączanie z Active Directory
        </div>
        <div className="text-center py-6">
          <FontAwesomeIcon
            icon={faWarning}
            className="text-[#535353] text-[80px]"
          />
        </div>
        <div className="pb-4 font-light text-[20px] text-justify">
          Aby rozłączyć się z Active Directory, podaj hasło administratora
          (Service Account).
        </div>
        <Input
          label="Hasło administratora"
          name="disconnectPassword"
          type="password"
          value={disconnectPassword}
          handleChange={(value: string) => {
            setDisconnectPassword(value);
            setDisconnectError(null);
          }}
        />
        {disconnectError && (
          <div className="mt-2 flex items-center gap-2 text-[14px] font-medium text-red-600">
            <FontAwesomeIcon icon={faCircleXmark} />
            {disconnectError}
          </div>
        )}
        <div className="flex justify-around mt-6">
          <ButtonPrimary
            icon={faXmark}
            text={t("common.cancel")}
            onClick={() => {
              setDisconnectModalOpen(false);
              setDisconnectPassword("");
              setDisconnectError(null);
            }}
          />
          <ButtonPrimary
            icon={faPlugCircleXmark}
            text={disconnectMutation.isPending ? "..." : t("settings.disconnect")}
            className="bg-[#F3606E] hover:bg-[#e04e5c]"
            onClick={() => disconnectMutation.mutate(disconnectPassword)}
            disabled={!disconnectPassword || disconnectMutation.isPending}
          />
        </div>
      </Modal>

      {/* CONNECTION FORM */}
      {!isConnected && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <h3 className="font-semibold mb-1 text-[18px]">
            <FontAwesomeIcon icon={faPlug} className="mr-2" />
            Połącz z Active Directory
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input
              label="Adres serwera LDAP"
              name="url"
              value={form.url}
              handleChange={handleFormChange("url")}
            />
            <Input
              label="Base DN"
              name="baseDN"
              value={form.baseDN}
              handleChange={handleFormChange("baseDN")}
            />
            <Input
              label="Nazwa użytkownika (Service Account)"
              name="username"
              value={form.username}
              handleChange={handleFormChange("username")}
            />
            <Input
              label="Hasło"
              name="password"
              type="password"
              value={form.password}
              handleChange={handleFormChange("password")}
            />
          </div>

          <div className="flex gap-3 mt-4">
            <ButtonPrimary
              text={
                testMutation.isPending ? "Testowanie..." : "Testuj połączenie"
              }
              icon={faVial}
              onClick={() => testMutation.mutate(form)}
              disabled={!isFormValid || isLoading}
            />
            <ButtonPrimary
              text={connectMutation.isPending ? "Łączenie..." : "Połącz"}
              icon={faPlug}
              onClick={() => connectMutation.mutate(form)}
              disabled={!isFormValid || isLoading}
            />
          </div>

          {/* Test / Connect result */}
          {(testResult || connectMutation.data) && (
            <div
              className={`mt-3 flex items-center gap-2 text-[14px] font-medium ${
                (testResult || connectMutation.data)?.success
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              <FontAwesomeIcon
                icon={
                  (testResult || connectMutation.data)?.success
                    ? faCircleCheck
                    : faCircleXmark
                }
              />
              {(testResult || connectMutation.data)?.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveDirectory;
