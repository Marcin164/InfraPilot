import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faSitemap, faPlus, faTrash, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CardHeader from "../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import Input from "../../../Components/Inputs/Input";
import SelectSecondary from "../../../Components/Inputs/SelectSecondary";
import { getDevicesOptions } from "../../../Services/devices";
import {
  AllocationStatus,
  CreateAllocationPayload,
  CreateSubnetPayload,
  createAllocation,
  createSubnet,
  deleteAllocation,
  deleteSubnet,
  getIpConflicts,
  getSubnetUtilization,
  getSubnets,
} from "../../../Services/ipam";

const STATUS_OPTIONS: { value: AllocationStatus; label: string }[] = [
  { value: "reserved", label: "Reserved" },
  { value: "assigned", label: "Assigned" },
  { value: "leased", label: "Leased" },
];

const Ipam = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(null);
  const [addingSubnet, setAddingSubnet] = useState(false);
  const [addingAllocation, setAddingAllocation] = useState(false);

  const subnetsQuery = useQuery({ queryKey: ["subnets"], queryFn: getSubnets });
  const conflictsQuery = useQuery({ queryKey: ["ip-conflicts"], queryFn: getIpConflicts });

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

  const [subnetForm, setSubnetForm] = useState<CreateSubnetPayload>({ name: "", cidr: "" });
  const [allocationForm, setAllocationForm] = useState<CreateAllocationPayload>({
    ip: "",
    status: "reserved",
  });

  const createSubnetMutation = useMutation({
    mutationFn: () => createSubnet(subnetForm),
    onSuccess: () => {
      toast.success(t("ipam.subnet.created"));
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      setAddingSubnet(false);
      setSubnetForm({ name: "", cidr: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? t("ipam.subnet.createFailed")),
  });

  const deleteSubnetMutation = useMutation({
    mutationFn: (id: string) => deleteSubnet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
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
    },
  });

  const subnets = subnetsQuery.data ?? [];
  const conflicts = conflictsQuery.data ?? [];
  const utilization = utilizationQuery.data;

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

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <div className="flex justify-between items-start">
            <CardHeader text={t("ipam.subnets")} />
            <ButtonPrimary icon={faPlus} onClick={() => setAddingSubnet(!addingSubnet)} />
          </div>

          {addingSubnet && (
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
                disabled={!subnetForm.name || !subnetForm.cidr || createSubnetMutation.isPending}
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
                <ButtonPrimary
                  icon={faTrash}
                  color="red"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    deleteSubnetMutation.mutate(s.id);
                  }}
                />
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
                <ButtonPrimary
                  icon={faPlus}
                  text={t("ipam.allocation.add")}
                  onClick={() => setAddingAllocation(!addingAllocation)}
                />
              </div>
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

              {addingAllocation && (
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
                        <span className="text-[11px] text-[#9a9a9a] ml-2">({e.source})</span>
                      </div>
                      {e.id && (
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
