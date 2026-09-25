import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { toast } from "react-toastify";
import { faCheck, faPen, faXmark, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import PlanPinPicker from "../../../../Components/Inputs/PlanPinPicker";
import { getLocations, findAncestorFloor } from "../../../../Services/locations";
import { DeviceDetailsPatch, updateDeviceDetails } from "../../../../Services/devices";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";

const DeviceLocation = () => {
  const { t } = useTranslation();
  const device: any = useOutletContext();
  const data = device?.data ?? {};
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({ queryKey: ["locations"], queryFn: getLocations });
  const locations = locationsQuery.data ?? [];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DeviceDetailsPatch>({});
  const permissionsQuery = usePermissions();
  const canEdit = hasPermission("devices.lifecycle.edit", permissionsQuery.data);

  const resetDraft = () =>
    setDraft({
      locationId: data.locationId ?? "",
      locationX: data.locationX ?? null,
      locationY: data.locationY ?? null,
    });

  const startEditing = () => {
    resetDraft();
    setEditing(true);
  };

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

  const selectedLocation = locations.find(
    (l) => l.id === (editing ? draft.locationId : data.locationId),
  );
  const floorLocation = findAncestorFloor(locations, selectedLocation?.id);

  const pinX = editing ? draft.locationX : data.locationX;
  const pinY = editing ? draft.locationY : data.locationY;

  const locationOptions = [
    { value: "", label: "—" },
    ...locations.map((l) => ({ value: l.id, label: l.name })),
  ];

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4 max-w-[900px]">
      <div className="flex justify-between items-start">
        <CardHeader text={t("device.location.title")} icon={faLocationDot} />
        {!editing ? (
          canEdit && (
            <ButtonPrimary icon={faPen} text={t("common.edit")} onClick={startEditing} />
          )
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

      <div className="mt-4 max-w-[300px]">
        {editing ? (
          <SelectSecondary
            options={locationOptions}
            value={locationOptions.find((o) => o.value === (draft.locationId ?? ""))}
            onSelect={(opt: any) =>
              setDraft((d) => ({
                ...d,
                locationId: opt?.value ?? "",
                locationX: null,
                locationY: null,
              }))
            }
          />
        ) : (
          <div className="font-bold text-[#3C3C3C]">
            {selectedLocation?.name ?? t("device.location.noLocation")}
          </div>
        )}
      </div>

      <div className="mt-4">
        <PlanPinPicker
          planLocation={floorLocation}
          x={pinX}
          y={pinY}
          onChange={(x, y) => setDraft((d) => ({ ...d, locationX: x, locationY: y }))}
          editable={editing}
          noLocationHint={
            selectedLocation ? t("device.location.noPlan") : t("device.location.noLocation")
          }
          noPlanHint={t("device.location.noPlan")}
          clickHint={t("device.location.clickToPlace")}
        />
      </div>
    </div>
  );
};

export default DeviceLocation;
