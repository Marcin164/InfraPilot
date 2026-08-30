import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faServer, faPlus, faTrash, faPlay, faPen } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import Input from "../../../Components/Inputs/Input";
import Checkbox from "../../../Components/Inputs/Checkbox";
import SelectSecondary from "../../../Components/Inputs/SelectSecondary";
import { getDevicesOptions } from "../../../Services/devices";
import {
  CreateDhcpServerPayload,
  DhcpServer,
  createDhcpServer,
  deleteDhcpServer,
  getDhcpServers,
  runDhcpServerSync,
  updateDhcpServer,
} from "../../../Services/dhcpServers";

const EMPTY_FORM: CreateDhcpServerPayload = {
  name: "",
  driverType: "ssh_scrape",
  deviceId: undefined,
  config: { command: "", lineTemplate: "" },
  enabled: false,
};

const DhcpServers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateDhcpServerPayload>(EMPTY_FORM);

  const sourcesQuery = useQuery({ queryKey: ["dhcp-servers"], queryFn: getDhcpServers });
  const devicesQuery = useQuery({ queryKey: ["devicesOptions"], queryFn: getDevicesOptions });
  const deviceOptions = useMemo(
    () =>
      (devicesQuery.data ?? []).map((d: any) => ({
        value: d.id,
        label: `${d.manufacturer ?? ""} ${d.model ?? ""} (${d.serialnumber ?? ""})`,
      })),
    [devicesQuery.data],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dhcp-servers"] });

  const resetForm = () => {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const createMutation = useMutation({
    mutationFn: () => createDhcpServer(form),
    onSuccess: () => {
      toast.success(t("dhcpServers.created"));
      invalidate();
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("dhcpServers.saveFailed")),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateDhcpServer(editingId!, form),
    onSuccess: () => {
      toast.success(t("dhcpServers.updated"));
      invalidate();
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("dhcpServers.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDhcpServer(id),
    onSuccess: invalidate,
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: (source: DhcpServer) => updateDhcpServer(source.id, { enabled: !source.enabled }),
    onSuccess: invalidate,
  });

  const runSyncMutation = useMutation({
    mutationFn: (id: string) => runDhcpServerSync(id),
    onSuccess: (result) => {
      toast.success(t("dhcpServers.syncSucceeded", { count: result.recordsFound }));
      queryClient.invalidateQueries({ queryKey: ["dhcp-servers"] });
      queryClient.invalidateQueries({ queryKey: ["subnet-utilization"] });
      queryClient.invalidateQueries({ queryKey: ["ip-conflicts"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("dhcpServers.syncFailed")),
  });

  const startEdit = (source: DhcpServer) => {
    setEditingId(source.id);
    setAdding(true);
    setForm({
      name: source.name,
      driverType: source.driverType,
      deviceId: source.deviceId ?? undefined,
      config: { command: "", lineTemplate: "", ...source.config },
      enabled: source.enabled,
    });
  };

  const sources = sourcesQuery.data ?? [];
  const command = (form.config?.command as string) ?? "";
  const lineTemplate = (form.config?.lineTemplate as string) ?? "";
  const canSave = !!form.name && !!form.deviceId && !!command && !!lineTemplate;

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-start">
        <CardHeader text={t("nav.dhcpServers")} icon={faServer} />
        <ButtonPrimary
          icon={faPlus}
          text={t("dhcpServers.add")}
          onClick={() => (adding ? resetForm() : setAdding(true))}
        />
      </div>
      <div className="mt-1 text-[13px] text-[#9a9a9a]">{t("dhcpServers.hint")}</div>

      {adding && (
        <div className="mt-4 bg-white shadow-xl rounded-[10px] p-4 max-w-[700px]">
          <CardHeader text={editingId ? t("dhcpServers.editSource") : t("dhcpServers.newSource")} />
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input
              label={t("dhcpServers.name")}
              value={form.name}
              handleChange={(v: string) => setForm({ ...form, name: v })}
            />
            <SelectSecondary
              label={t("dhcpServers.device")}
              options={deviceOptions}
              value={deviceOptions.find((o) => o.value === form.deviceId)}
              onSelect={(opt: any) => setForm({ ...form, deviceId: opt?.value })}
            />
          </div>
          <div className="mt-1 text-[11px] text-[#9a9a9a]">{t("dhcpServers.driverHint")}</div>
          <Input
            label={t("dhcpServers.command")}
            value={command}
            handleChange={(v: string) => setForm({ ...form, config: { ...form.config, command: v } })}
            placeholder="/ip dhcp-server lease print"
          />
          <Input
            label={t("dhcpServers.lineTemplate")}
            value={lineTemplate}
            handleChange={(v: string) =>
              setForm({ ...form, config: { ...form.config, lineTemplate: v } })
            }
            placeholder="{ip} {mac} {hostname} {expiry}"
          />
          <div className="mt-2 flex items-center gap-4">
            <Checkbox
              id="dhcp-source-enabled"
              label={t("dhcpServers.enabled")}
              checked={!!form.enabled}
              handleChange={(v: boolean) => setForm({ ...form, enabled: v })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <ButtonPrimary
              text={
                (editingId ? updateMutation.isPending : createMutation.isPending)
                  ? t("common.saving")
                  : t("common.save")
              }
              onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
              disabled={!canSave || createMutation.isPending || updateMutation.isPending}
            />
            <ButtonPrimary text={t("common.cancel")} onClick={resetForm} />
          </div>
        </div>
      )}

      <div className="mt-4 bg-white shadow-xl rounded-[10px] p-4">
        {sources.length === 0 ? (
          <div className="text-[14px] text-[#9a9a9a]">{t("dhcpServers.noSources")}</div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {sources.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3C3C3C]">{s.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                        s.lastSyncStatus === "success"
                          ? "bg-[#30A712]"
                          : s.lastSyncStatus === "failed"
                            ? "bg-[#F3606E]"
                            : "bg-[#9a9a9a]"
                      }`}
                    >
                      {s.lastSyncStatus === "success"
                        ? t("dhcpServers.statusSuccess")
                        : s.lastSyncStatus === "failed"
                          ? t("dhcpServers.statusFailed")
                          : t("dhcpServers.statusNeverRun")}
                    </span>
                    {!s.enabled && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white bg-[#9a9a9a]">
                        {t("dhcpServers.disabled")}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#9a9a9a] mt-0.5">
                    {s.device?.assetName || s.device?.model || s.deviceId} ·{" "}
                    {s.lastSyncAt
                      ? t("dhcpServers.lastSync", {
                          date: new Date(s.lastSyncAt).toLocaleString(),
                          count: s.lastSyncRecordCount ?? 0,
                        })
                      : t("dhcpServers.neverSynced")}
                  </div>
                  {s.lastSyncStatus === "failed" && s.lastSyncError && (
                    <div className="text-[12px] text-[#F3606E] mt-0.5">{s.lastSyncError}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Checkbox
                    id={`enabled-${s.id}`}
                    checked={s.enabled}
                    handleChange={() => toggleEnabledMutation.mutate(s)}
                  />
                  <ButtonPrimary
                    icon={faPlay}
                    color="green"
                    onClick={() => runSyncMutation.mutate(s.id)}
                    disabled={runSyncMutation.isPending}
                  />
                  <ButtonPrimary icon={faPen} onClick={() => startEdit(s)} />
                  <ButtonPrimary icon={faTrash} color="red" onClick={() => deleteMutation.mutate(s.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DhcpServers;
