import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { diffLines } from "diff";
import {
  faDatabase,
  faNetworkWired,
  faPlay,
  faEye,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import NoData from "../components/NoData";
import {
  ConfigBackup,
  SetCredentialPayload,
  SetLeaseSyncPayload,
  getBackup,
  getSshCredential,
  listBackups,
  runBackupNow,
  runLeaseSyncNow,
  setLeaseSync,
  setSshCredential,
} from "../../../../Services/networkDeviceBackup";

const Backup = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const data = device?.data;
  const deviceId = data?.id;
  const queryClient = useQueryClient();
  const [viewing, setViewing] = useState<ConfigBackup | null>(null);
  const [compare, setCompare] = useState(false);

  const credentialQuery = useQuery({
    queryKey: ["ssh-credential", deviceId],
    queryFn: () => getSshCredential(deviceId),
    enabled: !!deviceId,
  });

  const backupsQuery = useQuery({
    queryKey: ["config-backups", deviceId],
    queryFn: () => listBackups(deviceId),
    enabled: !!deviceId,
  });

  const [form, setForm] = useState<SetCredentialPayload>({
    sshUsername: "",
    sshPassword: "",
    sshPort: 22,
    backupCommand: "",
    backupEnabled: true,
  });

  const [leaseSyncForm, setLeaseSyncForm] = useState<SetLeaseSyncPayload>({
    leaseSyncCommand: "",
    leaseSyncLineTemplate: "",
    leaseSyncEnabled: false,
  });

  useEffect(() => {
    const cred = credentialQuery.data;
    if (!cred) return;
    setForm({
      sshUsername: cred.sshUsername,
      sshPassword: "",
      sshPort: cred.sshPort,
      backupCommand: cred.backupCommand,
      backupEnabled: cred.backupEnabled,
    });
    setLeaseSyncForm({
      leaseSyncCommand: cred.leaseSyncCommand ?? "",
      leaseSyncLineTemplate: cred.leaseSyncLineTemplate ?? "",
      leaseSyncEnabled: cred.leaseSyncEnabled,
    });
  }, [credentialQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => setSshCredential(deviceId, form),
    onSuccess: () => {
      toast.success(t("network.backup.credentialSaved"));
      queryClient.invalidateQueries({ queryKey: ["ssh-credential", deviceId] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("network.backup.credentialSaveFailed")),
  });

  const runMutation = useMutation({
    mutationFn: () => runBackupNow(deviceId),
    onSuccess: (result: ConfigBackup) => {
      queryClient.invalidateQueries({ queryKey: ["config-backups", deviceId] });
      if (result.success) {
        toast.success(t("network.backup.runSucceeded"));
      } else {
        toast.error(result.errorMessage ?? t("network.backup.runFailed"));
      }
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("network.backup.runFailed")),
  });

  const saveLeaseSyncMutation = useMutation({
    mutationFn: () => setLeaseSync(deviceId, leaseSyncForm),
    onSuccess: () => {
      toast.success(t("network.backup.leaseSyncSaved"));
      queryClient.invalidateQueries({ queryKey: ["ssh-credential", deviceId] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("network.backup.leaseSyncSaveFailed")),
  });

  const runLeaseSyncMutation = useMutation({
    mutationFn: () => runLeaseSyncNow(deviceId),
    onSuccess: (result: { recordsFound: number }) => {
      toast.success(t("network.backup.leaseSyncRunSucceeded", { count: result.recordsFound }));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("network.backup.leaseSyncRunFailed")),
  });

  const viewMutation = useMutation({
    mutationFn: (backupId: string) => getBackup(deviceId, backupId),
    onSuccess: (full: ConfigBackup) => setViewing(full),
  });

  if (!data) return <NoData />;

  const backups = backupsQuery.data ?? [];
  const hasCredential = !!credentialQuery.data;

  const previousContent = (() => {
    if (!viewing) return null;
    const idx = backups.findIndex((b) => b.id === viewing.id);
    const prev = backups.slice(idx + 1).find((b) => b.success);
    return prev;
  })();

  return (
    <div className="w-full cursor-default max-w-[800px]">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("device.tab.backup")} icon={faDatabase} />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Input
            label={t("network.backup.sshUsername")}
            value={form.sshUsername}
            handleChange={(v: string) => setForm({ ...form, sshUsername: v })}
          />
          <Input
            label={
              hasCredential
                ? t("network.backup.sshPasswordKeep")
                : t("network.backup.sshPassword")
            }
            type="password"
            value={form.sshPassword ?? ""}
            handleChange={(v: string) => setForm({ ...form, sshPassword: v })}
          />
          <Input
            label={t("network.backup.sshPort")}
            type="number"
            value={String(form.sshPort ?? 22)}
            handleChange={(v: string) => setForm({ ...form, sshPort: Number(v) || 22 })}
          />
          <div className="flex items-end pb-2">
            <Checkbox
              id="backup-enabled"
              label={t("network.backup.enabled")}
              checked={!!form.backupEnabled}
              handleChange={(v: boolean) => setForm({ ...form, backupEnabled: v })}
            />
          </div>
        </div>
        <Input
          label={t("network.backup.command")}
          value={form.backupCommand}
          handleChange={(v: string) => setForm({ ...form, backupCommand: v })}
          placeholder="show running-config"
        />
        <div className="mt-4 flex gap-2">
          <ButtonPrimary
            text={saveMutation.isPending ? t("common.saving") : t("common.save")}
            onClick={() => saveMutation.mutate()}
            disabled={!form.sshUsername || !form.backupCommand || saveMutation.isPending}
          />
          {hasCredential && (
            <ButtonPrimary
              icon={faPlay}
              text={runMutation.isPending ? t("network.backup.running") : t("network.backup.runNow")}
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              color="green"
            />
          )}
        </div>
      </div>

      {hasCredential && (
        <div className="bg-white shadow-xl rounded-[10px] p-4 mt-4">
          <CardHeader text={t("network.backup.leaseSyncTitle")} icon={faNetworkWired} />
          <div className="mt-1 text-[12px] text-[#9a9a9a]">{t("network.backup.leaseSyncHint")}</div>

          <Input
            label={t("network.backup.leaseSyncCommand")}
            value={leaseSyncForm.leaseSyncCommand}
            handleChange={(v: string) => setLeaseSyncForm({ ...leaseSyncForm, leaseSyncCommand: v })}
            placeholder="/ip dhcp-server lease print"
          />
          <Input
            label={t("network.backup.leaseSyncTemplate")}
            value={leaseSyncForm.leaseSyncLineTemplate}
            handleChange={(v: string) =>
              setLeaseSyncForm({ ...leaseSyncForm, leaseSyncLineTemplate: v })
            }
            placeholder="{ip} {mac} {hostname} {expiry}"
          />
          <div className="mt-1 text-[11px] text-[#9a9a9a]">{t("network.backup.leaseSyncTemplateHint")}</div>

          <div className="mt-2 flex items-center gap-4">
            <Checkbox
              id="lease-sync-enabled"
              label={t("network.backup.leaseSyncEnabled")}
              checked={!!leaseSyncForm.leaseSyncEnabled}
              handleChange={(v: boolean) => setLeaseSyncForm({ ...leaseSyncForm, leaseSyncEnabled: v })}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <ButtonPrimary
              text={saveLeaseSyncMutation.isPending ? t("common.saving") : t("common.save")}
              onClick={() => saveLeaseSyncMutation.mutate()}
              disabled={
                !leaseSyncForm.leaseSyncCommand ||
                !leaseSyncForm.leaseSyncLineTemplate ||
                saveLeaseSyncMutation.isPending
              }
            />
            <ButtonPrimary
              icon={faPlay}
              text={
                runLeaseSyncMutation.isPending
                  ? t("network.backup.running")
                  : t("network.backup.leaseSyncRunNow")
              }
              onClick={() => runLeaseSyncMutation.mutate()}
              disabled={runLeaseSyncMutation.isPending}
              color="green"
            />
          </div>
        </div>
      )}

      {hasCredential && (
        <div className="bg-white shadow-xl rounded-[10px] p-4 mt-4">
          <CardHeader text={t("network.backup.history")} />
          {backups.length === 0 ? (
            <div className="mt-4 text-[14px] text-[#9a9a9a]">{t("network.backup.noHistory")}</div>
          ) : (
            <div className="mt-4 divide-y divide-[#F0F0F0]">
              {backups.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white mr-2 ${
                        b.success ? "bg-[#30A712]" : "bg-[#F3606E]"
                      }`}
                    >
                      {b.success ? t("network.backup.success") : t("network.backup.failed")}
                    </span>
                    <span className="text-[13px] text-[#3C3C3C]">
                      {new Date(b.createdAt).toLocaleString()}
                    </span>
                    {b.errorMessage && (
                      <div className="text-[12px] text-[#F3606E] mt-1">{b.errorMessage}</div>
                    )}
                  </div>
                  {b.success && (
                    <ButtonPrimary
                      icon={faEye}
                      text={t("network.backup.view")}
                      onClick={() => viewMutation.mutate(b.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewing && (
        <div className="bg-white shadow-xl rounded-[10px] p-4 mt-4">
          <div className="flex justify-between items-start">
            <CardHeader text={new Date(viewing.createdAt).toLocaleString()} />
            <div className="flex gap-2">
              {previousContent && (
                <ButtonPrimary
                  text={compare ? t("network.backup.hideDiff") : t("network.backup.compareWithPrevious")}
                  onClick={() => setCompare(!compare)}
                />
              )}
              <ButtonPrimary icon={faXmark} onClick={() => setViewing(null)} />
            </div>
          </div>
          <pre className="mt-3 text-[12px] bg-[#F7F7F7] rounded-[10px] p-3 overflow-auto max-h-[500px] whitespace-pre-wrap">
            {compare && previousContent
              ? diffLines(previousContent.content ?? "", viewing.content ?? "").map((part, i) => (
                  <span
                    key={i}
                    className={
                      part.added
                        ? "bg-green-100 text-green-800"
                        : part.removed
                          ? "bg-red-100 text-red-800 line-through"
                          : ""
                    }
                  >
                    {part.value}
                  </span>
                ))
              : viewing.content}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Backup;
