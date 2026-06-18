import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import StatusPill, { StatusTone } from "../../../../Components/Badges/StatusPill";
import Parameter from "../../../../Components/Lists/Parameter";
import NoData from "../components/NoData";
import { getLocations } from "../../../../Services/locations";
import { groupTypeOptions, groupMappings } from "../../../../Constants/options";

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
const Overview = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const data = device?.data;

  const locationsQuery = useQuery({ queryKey: ["locations"], queryFn: getLocations });

  if (!data) return <NoData />;

  const groupLabel = groupTypeOptions.find((g) => g.value === data.group)?.label;
  const subgroupOptions =
    groupMappings.find((m) => m.group === data.group)?.subgroupOptions ?? [];
  const subgroupLabel = subgroupOptions.find((s: any) => s.value === data.subgroup)?.label;

  const locationName =
    (locationsQuery.data ?? []).find((l: any) => l.id === data.locationId)?.name ??
    data.location;

  return (
    <div className="w-full cursor-default max-w-[700px]">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("device.tab.overview")} icon={faCircleInfo} />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {groupLabel && <StatusPill tone="blue" text={t(groupLabel)} />}
          {subgroupLabel && <StatusPill tone="gray" text={t(subgroupLabel)} />}
          {data.lifecycle && (
            <StatusPill
              tone={LIFECYCLE_TONE[data.lifecycle] ?? "gray"}
              text={lifecycleLabel(t, data.lifecycle)}
            />
          )}
        </div>

        <div className="mt-4 divide-y divide-[#F0F0F0]">
          <Parameter name={t("device.assetname")} value={data.assetName} />
          <Parameter name={t("device.manufacturer")} value={data.manufacturer} />
          <Parameter name={t("device.model")} value={data.model} />
          <Parameter name={t("device.serial.number")} value={data.serialNumber} />
          <Parameter name={t("device.location")} value={locationName} />
        </div>
      </div>
    </div>
  );
};

export default Overview;
