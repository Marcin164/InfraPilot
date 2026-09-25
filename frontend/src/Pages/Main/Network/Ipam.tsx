import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faSitemap, faServer, faPlus, faTrash, faTriangleExclamation, faMagnifyingGlass, faPen, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CardHeader from "../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import Input from "../../../Components/Inputs/Input";
import SelectSecondary from "../../../Components/Inputs/SelectSecondary";
import { getDevicesOptions } from "../../../Services/devices";
import { getDhcpServers } from "../../../Services/dhcpServers";
import { getLocations } from "../../../Services/locations";
import { enqueueDeviceTask, listDeviceTasks, AgentTask, AgentTaskState } from "../../../Services/agentTasks";
import {
  AllocationStatus,
  CreateAllocationPayload,
  CreateSubnetPayload,
  createAllocation,
  createSubnet,
  deleteAllocation,
  deleteSubnet,
  getAllWindowsAgents,
  getIpConflicts,
  getScanCandidates,
  getSubnetUtilization,
  getSubnets,
  updateSubnet,
} from "../../../Services/ipam";
import { usePermissions } from "../../../Hooks/usePermissions";
import { hasPermission } from "../../../Constants/navigation";

const STATUS_OPTIONS: { value: AllocationStatus; label: string }[] = [
  { value: "reserved", label: "Reserved" },
  { value: "assigned", label: "Assigned" },
  { value: "leased", label: "Leased" },
];

// Client-side mirror of backend/src/helpers/cidr.ts's cidrRange() format
// check -- format-only, the backend stays the source of truth for the
// actual range math. Lets the Save button catch typos before a round trip.
const isValidCidr = (value: string): boolean => {
  const [ip, prefixStr] = value.trim().split("/");
  if (!ip || prefixStr === undefined) return false;
  const prefix = Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const octets = ip.split(".");
  if (octets.length !== 4) return false;
  return octets.every((o) => /^\d{1,3}$/.test(o) && Number(o) >= 0 && Number(o) <= 255);
};

const SCAN_STATE_COLOR: Record<AgentTaskState, string> = {
  queued: "#2B9AE9",
  leased: "#F1C40F",
  completed: "#30A712",
  failed: "#F3606E",
  cancelled: "#8A8A8A",
  expired: "#8E44AD",
};

const Ipam = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissionsQuery = usePermissions();
  const canManageIpam = hasPermission("ipam.manage", permissionsQuery.data);
  const canScan = hasPermission("devices.taskSchedule.manage", permissionsQuery.data);
  const canManageDhcp = hasPermission(["dhcp.view", "dhcp.manage"], permissionsQuery.data);
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(null);
  const [addingSubnet, setAddingSubnet] = useState(false);
  const [addingAllocation, setAddingAllocation] = useState(false);
  const [editingSubnet, setEditingSubnet] = useState(false);
  const [subnetEditForm, setSubnetEditForm] = useState<Partial<CreateSubnetPayload>>({});
  const [activeScanTaskId, setActiveScanTaskId] = useState<string | null>(null);

  const subnetsQuery = useQuery({ queryKey: ["subnets"], queryFn: getSubnets });
  const conflictsQuery = useQuery({ queryKey: ["ip-conflicts"], queryFn: getIpConflicts });
  const dhcpServersQuery = useQuery({ queryKey: ["dhcp-servers"], queryFn: getDhcpServers });
  const locationsQuery = useQuery({ queryKey: ["locations"], queryFn: getLocations });
  const locationOptions = useMemo(
    () => [
      { value: "", label: t("ipam.subnet.noLocation") },
      ...(locationsQuery.data ?? []).map((l) => ({ value: l.id, label: l.name })),
    ],
    [locationsQuery.data, t],
  );

  const utilizationQuery = useQuery({
    queryKey: ["subnet-utilization", selectedSubnetId],
    queryFn: () => getSubnetUtilization(selectedSubnetId!),
    enabled: !!selectedSubnetId,
  });

  const devicesQuery = useQuery({ queryKey: ["devicesOptions"], queryFn: getDevicesOptions });
  const deviceOptions = useMemo(
    () =>
      (devicesQuery.data ?? []).map((d: any) => ({
        value: d.id,
        label: `${d.manufacturer ?? ""} ${d.model ?? ""} (${d.serialnumber ?? ""})`,
      })),
    [devicesQuery.data],
  );

  const scanCandidatesQuery = useQuery({
    queryKey: ["scan-candidates", selectedSubnetId],
    queryFn: () => getScanCandidates(selectedSubnetId!),
    enabled: !!selectedSubnetId,
  });
  const toDeviceOption = (d: any) => ({
    value: d.id,
    label: d.assetName || `${d.manufacturer ?? ""} ${d.model ?? ""} (${d.serialNumber ?? d.serialnumber ?? ""})`,
  });
  const confirmedScanOptions = useMemo(
    () => (scanCandidatesQuery.data ?? []).map(toDeviceOption),
    [scanCandidatesQuery.data],
  );

  // getScanCandidates() couldn't confirm a match for this subnet (no
  // location set, no agent's own IP in range) -- rather than blocking
  // the scan outright, let the admin manually pick from every enrolled
  // Windows agent. Deliberately NOT the full device list: a plain device
  // with no agent at all would silently get picked as "the scanner", and
  // the resulting task would just sit queued forever, unclaimed.
  const allAgentsQuery = useQuery({
    queryKey: ["scan-agents"],
    queryFn: getAllWindowsAgents,
    enabled: !!selectedSubnetId && scanCandidatesQuery.isSuccess && confirmedScanOptions.length === 0,
  });
  const fallbackScanOptions = useMemo(
    () => (allAgentsQuery.data ?? []).map(toDeviceOption),
    [allAgentsQuery.data],
  );

  const isManualScanFallback = confirmedScanOptions.length === 0 && fallbackScanOptions.length > 0;
  const scanDeviceOptions = confirmedScanOptions.length > 0 ? confirmedScanOptions : fallbackScanOptions;
  const [manualScanDeviceId, setManualScanDeviceId] = useState<string | null>(null);
  const scanDevice = isManualScanFallback
    ? (scanDeviceOptions.find((o) => o.value === manualScanDeviceId) ?? scanDeviceOptions[0] ?? null)
    : (scanDeviceOptions[0] ?? null);

  useEffect(() => {
    setActiveScanTaskId(null);
    setEditingSubnet(false);
    setManualScanDeviceId(null);
  }, [selectedSubnetId]);

  const scanSubnetMutation = useMutation({
    mutationFn: (cidr: string) => {
      if (!scanDevice) throw new Error(t("ipam.scan.noDevice"));
      return enqueueDeviceTask(scanDevice.value, {
        type: "network_scan",
        payload: { cidr, subnetId: selectedSubnetId },
      });
    },
    onSuccess: (task) => {
      setActiveScanTaskId(task.id);
      toast.success(t("ipam.scan.queued"));
    },
    onError: (err: any) =>
      toast.error(err?.message ?? err?.response?.data?.message ?? t("ipam.scan.failed")),
  });

  const TERMINAL_STATES: AgentTaskState[] = ["completed", "failed", "cancelled", "expired"];
  const scanTaskQuery = useQuery({
    queryKey: ["device-tasks", scanDevice?.value],
    queryFn: () => listDeviceTasks(scanDevice!.value),
    enabled: !!activeScanTaskId && !!scanDevice,
    refetchInterval: (query) => {
      const tasks = query.state.data as AgentTask[] | undefined;
      const active = tasks?.find((t) => t.id === activeScanTaskId);
      return active && !TERMINAL_STATES.includes(active.state) ? 4000 : false;
    },
  });
  const activeScanTask = scanTaskQuery.data?.find((t) => t.id === activeScanTaskId) ?? null;

  const [subnetForm, setSubnetForm] = useState<CreateSubnetPayload>({ name: "", cidr: "" });
  const [allocationForm, setAllocationForm] = useState<CreateAllocationPayload>({
    ip: "",
    status: "reserved",
  });

  const invalidateReports = () => {
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-reports-batch"] });
  };

  const createSubnetMutation = useMutation({
    mutationFn: () => createSubnet(subnetForm),
    onSuccess: () => {
      toast.success(t("ipam.subnet.created"));
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      invalidateReports();
      setAddingSubnet(false);
      setSubnetForm({ name: "", cidr: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("ipam.subnet.createFailed")),
  });

  const updateSubnetMutation = useMutation({
    mutationFn: () => updateSubnet(selectedSubnetId!, subnetEditForm),
    onSuccess: () => {
      toast.success(t("ipam.subnet.updated"));
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["subnet-utilization", selectedSubnetId] });
      queryClient.invalidateQueries({ queryKey: ["scan-candidates", selectedSubnetId] });
      invalidateReports();
      setEditingSubnet(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("ipam.subnet.updateFailed")),
  });

  const deleteSubnetMutation = useMutation({
    mutationFn: (id: string) => deleteSubnet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      invalidateReports();
      setSelectedSubnetId(null);
    },
  });

  const createAllocationMutation = useMutation({
    mutationFn: () =>
      createAllocation({ ...allocationForm, subnetId: selectedSubnetId ?? undefined }),
    onSuccess: () => {
      toast.success(t("ipam.allocation.created"));
      queryClient.invalidateQueries({ queryKey: ["subnet-utilization", selectedSubnetId] });
      queryClient.invalidateQueries({ queryKey: ["ip-conflicts"] });
      invalidateReports();
      setAddingAllocation(false);
      setAllocationForm({ ip: "", status: "reserved" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("ipam.allocation.createFailed")),
  });

  const deleteAllocationMutation = useMutation({
    mutationFn: (id: string) => deleteAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnet-utilization", selectedSubnetId] });
      queryClient.invalidateQueries({ queryKey: ["ip-conflicts"] });
      invalidateReports();
    },
  });

  const subnets = subnetsQuery.data ?? [];
  const conflicts = conflictsQuery.data ?? [];
  const utilization = utilizationQuery.data;

  const dhcpSources = dhcpServersQuery.data ?? [];
  const dhcpActiveCount = dhcpSources.filter((s) => s.enabled).length;
  const dhcpFailedCount = dhcpSources.filter((s) => s.lastSyncStatus === "failed").length;
  const dhcpLastSyncAt = dhcpSources.reduce<string | null>((latest, s) => {
    if (!s.lastSyncAt) return latest;
    if (!latest || s.lastSyncAt > latest) return s.lastSyncAt;
    return latest;
  }, null);

  return (
    <div className="w-full p-4">
      <CardHeader text={t("nav.ipam")} icon={faSitemap} />

      {conflicts.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-[10px] p-4">
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            {t("ipam.conflicts.title", { count: conflicts.length })}
          </div>
          <div className="mt-2 divide-y divide-red-200">
            {conflicts.map((c) => (
              <div key={c.ip} className="py-1.5 text-[13px] text-red-700">
                <span className="font-bold">{c.ip}</span>:{" "}
                {c.owners.map((o) => o.label).join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`mt-4 rounded-[10px] p-4 flex flex-wrap items-center justify-between gap-3 border ${
          dhcpFailedCount > 0
            ? "bg-red-50 border-red-200"
            : dhcpSources.length === 0
              ? "bg-[#F7F7F7] border-[#F0F0F0]"
              : "bg-blue-50 border-blue-200"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-[13px] ${
            dhcpFailedCount > 0 ? "text-red-700" : "text-[#3C3C3C]"
          }`}
        >
          <FontAwesomeIcon icon={faServer} />
          {dhcpSources.length === 0 ? (
            <span>{t("ipam.dhcp.none")}</span>
          ) : (
            <span>
              {t("ipam.dhcp.summary", { active: dhcpActiveCount, total: dhcpSources.length })}
              {" · "}
              {dhcpLastSyncAt
                ? t("ipam.dhcp.lastSync", { date: new Date(dhcpLastSyncAt).toLocaleString() })
                : t("ipam.dhcp.neverSynced")}
              {dhcpFailedCount > 0 && (
                <span className="font-bold"> · {t("ipam.dhcp.failedWarning", { count: dhcpFailedCount })}</span>
              )}
            </span>
          )}
        </div>
        {canManageDhcp && (
          <ButtonPrimary
            text={dhcpSources.length === 0 ? t("ipam.dhcp.setup") : t("ipam.dhcp.manage")}
            onClick={() => navigate("/admin/dhcp-servers")}
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <div className="flex justify-between items-start">
            <CardHeader text={t("ipam.subnets")} />
            {canManageIpam && (
              <ButtonPrimary icon={faPlus} onClick={() => setAddingSubnet(!addingSubnet)} />
            )}
          </div>

          {addingSubnet && canManageIpam && (
            <div className="mt-3 border border-[#F0F0F0] rounded-[10px] p-3">
              <Input
                label={t("ipam.subnet.name")}
                value={subnetForm.name}
                handleChange={(v: string) => setSubnetForm({ ...subnetForm, name: v })}
              />
              <Input
                label={t("ipam.subnet.cidr")}
                placeholder="192.168.1.0/24"
                value={subnetForm.cidr}
                handleChange={(v: string) => setSubnetForm({ ...subnetForm, cidr: v })}
                errors={subnetForm.cidr && !isValidCidr(subnetForm.cidr) ? t("ipam.subnet.cidrInvalid") : undefined}
              />
              <Input
                label={t("ipam.subnet.vlan")}
                value={subnetForm.vlan ?? ""}
                handleChange={(v: string) => setSubnetForm({ ...subnetForm, vlan: v })}
              />
              <Input
                label={t("ipam.subnet.gateway")}
                value={subnetForm.gateway ?? ""}
                handleChange={(v: string) => setSubnetForm({ ...subnetForm, gateway: v })}
              />
              <ButtonPrimary
                text={t("common.save")}
                className="mt-3"
                onClick={() => createSubnetMutation.mutate()}
                disabled={
                  !subnetForm.name ||
                  !isValidCidr(subnetForm.cidr) ||
                  createSubnetMutation.isPending
                }
              />
            </div>
          )}

          <div className="mt-3 divide-y divide-[#F0F0F0]">
            {subnets.map((s) => (
              <div
                key={s.id}
                className={`py-2 px-2 -mx-2 rounded cursor-pointer flex items-center justify-between ${
                  selectedSubnetId === s.id ? "bg-blue-50" : ""
                }`}
                onClick={() => setSelectedSubnetId(s.id)}
              >
                <div>
                  <div className="font-bold text-[#3C3C3C]">{s.name}</div>
                  <div className="text-[12px] text-[#9a9a9a]">
                    {s.cidr} {s.vlan && `· VLAN ${s.vlan}`}
                  </div>
                </div>
                {canManageIpam && (
                  <ButtonPrimary
                    icon={faTrash}
                    color="red"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      deleteSubnetMutation.mutate(s.id);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-[10px] p-4 md:col-span-2">
          {!selectedSubnetId || !utilization ? (
            <div className="text-[14px] text-[#9a9a9a]">{t("ipam.selectSubnet")}</div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <CardHeader text={utilization.subnet.name} />
                <div className="flex items-center gap-2">
                  {!editingSubnet && canManageIpam && (
                    <ButtonPrimary
                      icon={faPen}
                      text={t("common.edit")}
                      onClick={() => {
                        setSubnetEditForm({
                          name: utilization.subnet.name,
                          cidr: utilization.subnet.cidr,
                          vlan: utilization.subnet.vlan ?? "",
                          gateway: utilization.subnet.gateway ?? "",
                          locationId: utilization.subnet.locationId ?? "",
                        });
                        setEditingSubnet(true);
                      }}
                    />
                  )}
                  {canManageIpam && (
                    <ButtonPrimary
                      icon={faPlus}
                      text={t("ipam.allocation.add")}
                      onClick={() => setAddingAllocation(!addingAllocation)}
                    />
                  )}
                </div>
              </div>

              {editingSubnet && canManageIpam && (
                <div className="mt-3 border border-[#F0F0F0] rounded-[10px] p-3">
                  <Input
                    label={t("ipam.subnet.name")}
                    value={subnetEditForm.name ?? ""}
                    handleChange={(v: string) => setSubnetEditForm({ ...subnetEditForm, name: v })}
                  />
                  <Input
                    label={t("ipam.subnet.cidr")}
                    value={subnetEditForm.cidr ?? ""}
                    handleChange={(v: string) => setSubnetEditForm({ ...subnetEditForm, cidr: v })}
                    errors={
                      subnetEditForm.cidr && !isValidCidr(subnetEditForm.cidr)
                        ? t("ipam.subnet.cidrInvalid")
                        : undefined
                    }
                  />
                  <Input
                    label={t("ipam.subnet.vlan")}
                    value={subnetEditForm.vlan ?? ""}
                    handleChange={(v: string) => setSubnetEditForm({ ...subnetEditForm, vlan: v })}
                  />
                  <Input
                    label={t("ipam.subnet.gateway")}
                    value={subnetEditForm.gateway ?? ""}
                    handleChange={(v: string) => setSubnetEditForm({ ...subnetEditForm, gateway: v })}
                  />
                  <div className="mt-2">
                    <SelectSecondary
                      label={t("ipam.subnet.location")}
                      options={locationOptions}
                      value={locationOptions.find((o) => o.value === (subnetEditForm.locationId ?? ""))}
                      onSelect={(opt: any) =>
                        setSubnetEditForm({ ...subnetEditForm, locationId: opt?.value || null })
                      }
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <ButtonPrimary
                      icon={faCheck}
                      text={updateSubnetMutation.isPending ? t("common.saving") : t("common.save")}
                      onClick={() => updateSubnetMutation.mutate()}
                      disabled={
                        !subnetEditForm.name ||
                        !isValidCidr(subnetEditForm.cidr ?? "") ||
                        updateSubnetMutation.isPending
                      }
                    />
                    <ButtonPrimary
                      icon={faXmark}
                      text={t("common.cancel")}
                      onClick={() => setEditingSubnet(false)}
                    />
                  </div>
                </div>
              )}

              {!editingSubnet && (
                <div className="mt-1 text-[12px] text-[#9a9a9a]">
                  {t("ipam.subnet.location")}:{" "}
                  {locationOptions.find((o) => o.value === (utilization.subnet.locationId ?? ""))?.label ??
                    t("ipam.subnet.noLocation")}
                </div>
              )}

              <div className="mt-2 text-[13px] text-[#3C3C3C]">
                {t("ipam.utilization", {
                  used: utilization.used,
                  total: utilization.total,
                  free: utilization.free,
                })}
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#F0F0F0] overflow-hidden">
                <div
                  className="h-full bg-[#2B9AE9]"
                  style={{
                    width: `${Math.min(100, (utilization.used / Math.max(1, utilization.total)) * 100)}%`,
                  }}
                />
              </div>

              {canScan && (
                <div className="mt-3 border border-[#F0F0F0] rounded-[10px] p-3">
                  {isManualScanFallback && (
                    <div className="mb-2 max-w-[280px]">
                      <SelectSecondary
                        label={t("ipam.scan.manualPickLabel")}
                        options={scanDeviceOptions}
                        value={scanDeviceOptions.find((o) => o.value === scanDevice?.value)}
                        onSelect={(opt: any) => setManualScanDeviceId(opt?.value ?? null)}
                      />
                      <p className="text-[11px] text-[#9a9a9a] mt-1">{t("ipam.scan.manualPickHint")}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <ButtonPrimary
                      icon={faMagnifyingGlass}
                      text={
                        scanSubnetMutation.isPending
                          ? t("ipam.scan.queuing")
                          : t("ipam.scan.scanSubnet")
                      }
                      onClick={() => scanSubnetMutation.mutate(utilization.subnet.cidr)}
                      disabled={scanSubnetMutation.isPending || !scanDevice}
                    />
                    {scanDevice && !isManualScanFallback ? (
                      <span className="text-[12px] text-[#9a9a9a]">
                        {t("ipam.scan.willUse", { device: scanDevice.label })}
                      </span>
                    ) : !scanDevice ? (
                      <span className="text-[12px] text-[#9a9a9a]">{t("ipam.scan.noAgents")}</span>
                    ) : null}
                  </div>

                  {activeScanTask && (
                    <div className="mt-2 flex items-center gap-2 text-[12px]">
                      <span
                        className="inline-block w-[70px] text-center rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                        style={{ backgroundColor: SCAN_STATE_COLOR[activeScanTask.state] }}
                      >
                        {activeScanTask.state}
                      </span>
                      {activeScanTask.state === "completed" && (
                        <span className="text-[#3C3C3C]">
                          {t("ipam.scan.hostsFound", { count: activeScanTask.result?.hosts?.length ?? 0 })}
                        </span>
                      )}
                      {activeScanTask.state === "failed" && (
                        <span className="text-[#F3606E]">{activeScanTask.lastError}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {addingAllocation && canManageIpam && (
                <div className="mt-3 border border-[#F0F0F0] rounded-[10px] p-3">
                  <Input
                    label={t("ipam.allocation.ip")}
                    value={allocationForm.ip}
                    handleChange={(v: string) => setAllocationForm({ ...allocationForm, ip: v })}
                  />
                  <SelectSecondary
                    label={t("ipam.allocation.status")}
                    options={STATUS_OPTIONS}
                    value={STATUS_OPTIONS.find((o) => o.value === allocationForm.status)}
                    onSelect={(opt: any) => setAllocationForm({ ...allocationForm, status: opt.value })}
                  />
                  <SelectSecondary
                    label={t("ipam.allocation.device")}
                    options={[{ value: "", label: "—" }, ...deviceOptions]}
                    value={[{ value: "", label: "—" }, ...deviceOptions].find(
                      (o) => o.value === (allocationForm.deviceId ?? ""),
                    )}
                    onSelect={(opt: any) =>
                      setAllocationForm({ ...allocationForm, deviceId: opt?.value || undefined })
                    }
                  />
                  <Input
                    label={t("ipam.allocation.hostname")}
                    value={allocationForm.hostname ?? ""}
                    handleChange={(v: string) => setAllocationForm({ ...allocationForm, hostname: v })}
                  />
                  <ButtonPrimary
                    text={t("common.save")}
                    className="mt-3"
                    onClick={() => createAllocationMutation.mutate()}
                    disabled={!allocationForm.ip || createAllocationMutation.isPending}
                  />
                </div>
              )}

              <div className="mt-4 divide-y divide-[#F0F0F0]">
                {utilization.entries.length === 0 ? (
                  <div className="py-3 text-[13px] text-[#9a9a9a]">{t("ipam.noEntries")}</div>
                ) : (
                  utilization.entries.map((e) => (
                    <div key={e.ip} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#3C3C3C] mr-2">{e.ip}</span>
                        <span className="text-[13px] text-[#9a9a9a]">{e.label}</span>
                        {e.source === "scan" ? (
                          <span className="text-[11px] font-bold text-[#2B9AE9] ml-2">
                            {t("ipam.scan.discoveredBadge")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#9a9a9a] ml-2">({e.source})</span>
                        )}
                      </div>
                      {e.id && canManageIpam && (
                        <ButtonPrimary
                          icon={faTrash}
                          color="red"
                          onClick={() => deleteAllocationMutation.mutate(e.id!)}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ipam;
