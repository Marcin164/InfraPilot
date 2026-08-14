import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Input from "../Inputs/Input";
import SelectSecondary from "../Inputs/SelectSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { getLocations } from "../../Services/locations";
import { updateDeviceDetails } from "../../Services/devices";

type Props = {
  id: string;
  assetName: string;
  serialNumber: any;
  model: any;
  manufacturer: any;
  locationId?: string;
};

const EditEquipmentForm = ({
  id,
  assetName,
  serialNumber,
  model,
  manufacturer,
  locationId,
}: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const locationsQuery = useQuery({ queryKey: ["locations"], queryFn: getLocations });
  const locationOptions = [
    { value: "", label: "—" },
    ...(locationsQuery.data ?? []).map((l) => ({ value: l.id, label: l.name })),
  ];

  const mutation = useMutation({
    mutationFn: (values: {
      assetName: string;
      serialNumber: string;
      model: string;
      manufacturer: string;
      locationId: string;
    }) =>
      updateDeviceDetails(id, {
        ...values,
        locationId: values.locationId || undefined,
      }),
    onSuccess: () => {
      toast.success(t("device.details.updated"));
      queryClient.invalidateQueries({ queryKey: ["userDevice"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.details.updateFailed")),
  });

  const form = useForm({
    defaultValues: {
      assetName: assetName || "",
      serialNumber: serialNumber || "",
      model: model || "",
      manufacturer: manufacturer || "",
      locationId: locationId || "",
    },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="flex">
        <div className="w-full mr-2">
          <form.Field
            name="assetName"
            children={(field) => (
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                label={t("device.assetname")}
              />
            )}
          />
          <form.Field
            name="model"
            children={(field) => (
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                label={t("device.model")}
              />
            )}
          />
          <form.Field
            name="manufacturer"
            children={(field) => (
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                label={t("device.manufacturer")}
              />
            )}
          />
          <form.Field
            name="serialNumber"
            children={(field) => (
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                label={t("device.serial.number")}
              />
            )}
          />
          <form.Field
            name="locationId"
            children={(field) => (
              <div className="pt-2">
                <div className="font-bold text-[#3C3C3C]">{t("device.location")}</div>
                <SelectSecondary
                  options={locationOptions}
                  value={locationOptions.find((o) => o.value === field.state.value)}
                  onSelect={(opt: any) => field.handleChange(opt?.value ?? "")}
                />
              </div>
            )}
          />
        </div>
      </div>
      <div className="pt-4">
        <ButtonPrimary
          icon={faCheck}
          type="submit"
          text={mutation.isPending ? t("common.saving") : t("common.save")}
          disabled={mutation.isPending}
        />
      </div>
    </form>
  );
};

export default EditEquipmentForm;
