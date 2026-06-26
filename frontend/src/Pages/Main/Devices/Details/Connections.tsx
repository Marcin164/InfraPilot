import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faNetworkWired, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import NoData from "../components/NoData";
import { getDevicesOptions } from "../../../../Services/devices";
import {
  CreateConnectionPayload,
  NetworkLinkType,
  createConnection,
  deleteConnection,
  getConnectionsForDevice,
} from "../../../../Services/networkConnections";

const LINK_TYPE_OPTIONS: { value: NetworkLinkType; label: string }[] = [
  { value: "ethernet", label: "Ethernet" },
  { value: "fiber", label: "Fiber" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "other", label: "Other" },
];

const Connections = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const data = device?.data;
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const connectionsQuery = useQuery({
    queryKey: ["network-connections", data?.id],
    queryFn: () => getConnectionsForDevice(data.id),
    enabled: !!data?.id,
  });

  const devicesQuery = useQuery({
    queryKey: ["devicesOptions"],
    queryFn: getDevicesOptions,
  });

  const deviceOptions = useMemo(
    () =>
      (devicesQuery.data ?? [])
        .filter((d: any) => d.id !== data?.id)
        .map((d: any) => ({
          value: d.id,
          label: `${d.manufacturer ?? ""} ${d.model ?? ""} (${d.serialnumber ?? ""})`,
        })),
    [devicesQuery.data, data?.id],
  );

  const deviceLabel = (id: string) => {
    const opt = (devicesQuery.data ?? []).find((d: any) => d.id === id);
    return opt ? `${opt.manufacturer ?? ""} ${opt.model ?? ""}` : id;
  };

  const [draft, setDraft] = useState<CreateConnectionPayload>({
    sourceDeviceId: data?.id ?? "",
    targetDeviceId: "",
    sourcePort: "",
    targetPort: "",
    linkType: "ethernet",
    vlan: "",
  });

  const createMutation = useMutation({
    mutationFn: () => createConnection({ ...draft, sourceDeviceId: data.id }),
    onSuccess: () => {
      toast.success(t("network.connection.created"));
      queryClient.invalidateQueries({ queryKey: ["network-connections", data?.id] });
      setAdding(false);
      setDraft({
        sourceDeviceId: data?.id ?? "",
        targetDeviceId: "",
        sourcePort: "",
        targetPort: "",
        linkType: "ethernet",
        vlan: "",
      });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("network.connection.createFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-connections", data?.id] });
    },
  });

  if (!data) return <NoData />;

  const connections = connectionsQuery.data ?? [];

  return (
    <div className="w-full cursor-default max-w-[800px]">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex justify-between items-start">
          <CardHeader text={t("device.tab.connections")} icon={faNetworkWired} />
          {!adding && (
            <ButtonPrimary
              icon={faPlus}
              text={t("network.connection.add")}
              onClick={() => setAdding(true)}
            />
          )}
        </div>

        {connections.length === 0 && !adding && (
          <div className="mt-4 text-[14px] text-[#9a9a9a]">
            {t("network.connection.none")}
          </div>
        )}

        {connections.length > 0 && (
          <div className="mt-4 divide-y divide-[#F0F0F0]">
            {connections.map((c: any) => {
              const otherId = c.sourceDeviceId === data.id ? c.targetDeviceId : c.sourceDeviceId;
              const otherPort = c.sourceDeviceId === data.id ? c.targetPort : c.sourcePort;
              const ownPort = c.sourceDeviceId === data.id ? c.sourcePort : c.targetPort;
              return (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#3C3C3C]">{deviceLabel(otherId)}</div>
                    <div className="text-[12px] text-[#9a9a9a]">
                      {ownPort && <span>{t("network.connection.port")}: {ownPort} → </span>}
                      {otherPort && <span>{otherPort} · </span>}
                      <span>{c.linkType}</span>
                      {c.vlan && <span> · VLAN {c.vlan}</span>}
                    </div>
                  </div>
                  <ButtonPrimary
                    icon={faTrash}
                    color="red"
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        )}

        {adding && (
          <div className="mt-4 border border-[#F0F0F0] rounded-[10px] p-3">
            <SelectSecondary
              label={t("network.connection.targetDevice")}
              options={deviceOptions}
              value={deviceOptions.find((o: any) => o.value === draft.targetDeviceId)}
              onSelect={(opt: any) => setDraft({ ...draft, targetDeviceId: opt?.value ?? "" })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("network.connection.sourcePort")}
                value={draft.sourcePort ?? ""}
                handleChange={(v: string) => setDraft({ ...draft, sourcePort: v })}
              />
              <Input
                label={t("network.connection.targetPort")}
                value={draft.targetPort ?? ""}
                handleChange={(v: string) => setDraft({ ...draft, targetPort: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-bold text-[#3C3C3C] mt-2">{t("network.connection.linkType")}</div>
                <SelectSecondary
                  options={LINK_TYPE_OPTIONS}
                  value={LINK_TYPE_OPTIONS.find((o) => o.value === draft.linkType)}
                  onSelect={(opt: any) => setDraft({ ...draft, linkType: opt?.value })}
                />
              </div>
              <Input
                label={t("network.connection.vlan")}
                value={draft.vlan ?? ""}
                handleChange={(v: string) => setDraft({ ...draft, vlan: v })}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <ButtonPrimary
                text={createMutation.isPending ? t("common.saving") : t("common.save")}
                onClick={() => createMutation.mutate()}
                disabled={!draft.targetDeviceId || createMutation.isPending}
              />
              <ButtonPrimary
                text={t("common.cancel")}
                color="white"
                onClick={() => setAdding(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
