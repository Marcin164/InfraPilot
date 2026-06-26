import { useEffect, useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { faCircleInfo, faPen, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import CardHeader from "../../../../Components/Headers/CardHeader";
import StatusPill, { StatusTone } from "../../../../Components/Badges/StatusPill";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import Parameter from "../../../../Components/Lists/Parameter";
import NoData from "../components/NoData";
import { getLocations } from "../../../../Services/locations";
import { groupTypeOptions, groupMappings } from "../../../../Constants/options";
import {
  DeviceDetailsPatch,
  updateDeviceDetails,
} from "../../../../Services/devices";

// Same value->label mapping as Lifecycle.tsx's local stateLabel() --
// duplicated rather than imported since that one isn't exported and this
// is the only other call site.
const LIFECYCLE_TONE: Record<string, StatusTone> = {
  procurement: "blue",
  active: "green",
  in_repair: "amber",
  in_storage: "gray",
  retired: "gray",
  disposed: "red",
  lost: "red",
};
const lifecycleLabel = (t: (k: string) => string, val: string) => {
  switch (val) {
    case "procurement": return t("device.lifecycle.procurement");
    case "active": return t("device.lifecycle.active");
    case "in_repair": return t("device.lifecycle.repair");
    case "in_storage": return t("device.lifecycle.storage");
    case "retired": return t("device.lifecycle.retired");
    case "disposed": return t("device.lifecycle.disposed");
    case "lost": return t("device.lifecycle.lost");
    default: return val;
  }
};

// For manually-tracked, non-scanned records (Components/Peripherals/
// Network/Other groups -- a spare RAM stick, a GPU on the shelf, a
// switch, a phone...). There's no agent reporting in, so the
// Hardware/Software/Network/... tabs would just be a wall of "No data".
// This tab is what shows instead -- identity + classification + where
// it physically is. Assignment/lifecycle/QR label/maintenance already
// work for every group (see deviceNavbarItems' "all" scope) so they're
// not duplicated here.
const isNetworkDevice = (group: string) => group === "Network";

const Overview = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const data = device?.data;
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({ queryKey: ["locations"], queryFn: getLocations });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DeviceDetailsPatch>({});

  useEffect(() => {
    if (!data) return;
    setDraft({
      assetName: data.assetName ?? "",
      model: data.model ?? "",
      manufacturer: data.manufacturer ?? "",
      serialNumber: data.serialNumber ?? "",
      locationId: data.locationId ?? "",
      managementIp: data.managementIp ?? "",
      portCount: data.portCount ?? "",
      firmwareVersion: data.firmwareVersion ?? "",
      macAddress: data.macAddress ?? "",
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateDeviceDetails(data.id, draft),
    onSuccess: () => {
      toast.success(t("device.details.updated"));
      queryClient.invalidateQueries({ queryKey: ["device"] });
      setEditing(false);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.details.updateFailed")),
  });

  if (!data) return <NoData />;

  const groupLabel = groupTypeOptions.find((g) => g.value === data.group)?.label;
  const subgroupOptions =
    groupMappings.find((m) => m.group === data.group)?.subgroupOptions ?? [];
  const subgroupLabel = subgroupOptions.find((s: any) => s.value === data.subgroup)?.label;

  const locations = locationsQuery.data ?? [];
  const locationName =
    locations.find((l: any) => l.id === data.locationId)?.name ?? data.location;

  const showNetworkFields = isNetworkDevice(data.group);

  return (
    <div className="w-full cursor-default max-w-[700px]">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex justify-between items-start">
          <CardHeader text={t("device.tab.overview")} icon={faCircleInfo} />
          {!editing ? (
            <ButtonPrimary
              icon={faPen}
              text={t("common.edit")}
              onClick={() => setEditing(true)}
            />
          ) : (
            <div className="flex gap-2">
              <ButtonPrimary
                icon={faCheck}
                text={mutation.isPending ? t("common.saving") : t("common.save")}
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              />
              <ButtonPrimary
                icon={faXmark}
                text={t("common.cancel")}
                onClick={() => setEditing(false)}
              />
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {groupLabel && <StatusPill tone="blue" text={t(groupLabel)} />}
          {subgroupLabel && <StatusPill tone="gray" text={t(subgroupLabel)} />}
          {data.lifecycle && (
            <StatusPill
              tone={LIFECYCLE_TONE[data.lifecycle] ?? "gray"}
              text={lifecycleLabel(t, data.lifecycle)}
            />
          )}
          {data.managementIp && (
            <StatusPill
              tone={
                data.pingStatus === "up" ? "green" : data.pingStatus === "down" ? "red" : "gray"
              }
              text={
                data.pingStatus === "up"
                  ? t("device.ping.up")
                  : data.pingStatus === "down"
                    ? t("device.ping.down")
                    : t("device.ping.unknown")
              }
            />
          )}
        </div>
        {data.managementIp && data.lastPingAt && (
          <div className="mt-1 text-[12px] text-[#9a9a9a]">
            {t("device.ping.lastChecked", { when: moment(data.lastPingAt).fromNow() })}
          </div>
        )}

        {!editing ? (
          <div className="mt-4 divide-y divide-[#F0F0F0]">
            <Parameter name={t("device.assetname")} value={data.assetName} />
            <Parameter name={t("device.manufacturer")} value={data.manufacturer} />
            <Parameter name={t("device.model")} value={data.model} />
            <Parameter name={t("device.serial.number")} value={data.serialNumber} />
            <Parameter name={t("device.location")} value={locationName} />
            {showNetworkFields && (
              <>
                <Parameter name={t("device.managementIp")} value={data.managementIp} />
                <Parameter name={t("device.portCount")} value={data.portCount} />
                <Parameter name={t("device.firmwareVersion")} value={data.firmwareVersion} />
                <Parameter name={t("device.macAddress")} value={data.macAddress} />
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label={t("device.assetname")}
              value={draft.assetName ?? ""}
              handleChange={(v: string) => setDraft({ ...draft, assetName: v })}
            />
            <Input
              label={t("device.manufacturer")}
              value={draft.manufacturer ?? ""}
              handleChange={(v: string) => setDraft({ ...draft, manufacturer: v })}
            />
            <Input
              label={t("device.model")}
              value={draft.model ?? ""}
              handleChange={(v: string) => setDraft({ ...draft, model: v })}
            />
            <Input
              label={t("device.serial.number")}
              value={draft.serialNumber ?? ""}
              handleChange={(v: string) => setDraft({ ...draft, serialNumber: v })}
            />
            <div>
              <div className="font-bold text-[#3C3C3C]">{t("device.location")}</div>
              <SelectSecondary
                options={[
                  { value: "", label: "—" },
                  ...locations.map((l: any) => ({ value: l.id, label: l.name })),
                ]}
                value={[
                  { value: "", label: "—" },
                  ...locations.map((l: any) => ({ value: l.id, label: l.name })),
                ].find((o) => o.value === (draft.locationId ?? ""))}
                onSelect={(opt: any) => setDraft({ ...draft, locationId: opt?.value ?? "" })}
              />
            </div>
            {showNetworkFields && (
              <>
                <Input
                  label={t("device.managementIp")}
                  value={draft.managementIp ?? ""}
                  handleChange={(v: string) => setDraft({ ...draft, managementIp: v })}
                />
                <Input
                  label={t("device.portCount")}
                  type="number"
                  value={draft.portCount ?? ""}
                  handleChange={(v: string) => setDraft({ ...draft, portCount: v })}
                />
                <Input
                  label={t("device.firmwareVersion")}
                  value={draft.firmwareVersion ?? ""}
                  handleChange={(v: string) => setDraft({ ...draft, firmwareVersion: v })}
                />
                <Input
                  label={t("device.macAddress")}
                  value={draft.macAddress ?? ""}
                  handleChange={(v: string) => setDraft({ ...draft, macAddress: v })}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
