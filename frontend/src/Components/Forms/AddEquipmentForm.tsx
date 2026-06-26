import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addDevice } from "../../Services/devices";
import {
  computersTypeOptions,
  groupMappings,
  groupTypeOptions,
} from "../../Constants/options";
import { addDeviceDefaultValues } from "../../Constants/defaultValues";
import { requiredValidator } from "../../Helpers/validators";
import Input from "../Inputs/Input";
import SelectSecondary from "../Inputs/SelectSecondary";
import { toast } from "react-toastify";
import { CreateDeviceData } from "../../Types";
import { useTranslation } from "react-i18next";
import { getLocations } from "../../Services/locations";

type Option = { label: string; value: string };

const AddEquipmentForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [subgroupOptions, setSubgroupOptions] =
    useState<Option[]>(computersTypeOptions);

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateDeviceData) => {
      return addDevice(values);
    },

    onSuccess: () => {
      toast.success(t("toast.success.device"));
      queryClient.invalidateQueries({ queryKey: ["users"] });
      close();
    },
  });

  const form = useForm({
    defaultValues: addDeviceDefaultValues,
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleGroupSelect = (option: Option, field: any) => {
    const mapping = groupMappings.find((m) => m.group === option.value);
    const newSubgroups = mapping?.subgroupOptions ?? [];

    setSubgroupOptions(newSubgroups);
    field.handleChange(option.value);
    form.setFieldValue("subgroup", newSubgroups[0]?.value ?? "");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="group"
        children={(field) => (
          <SelectSecondary
            label={t("device.group")}
            options={groupTypeOptions.map((o) => ({ ...o, label: t(o.label) }))}
            value={groupTypeOptions
              .map((o) => ({ ...o, label: t(o.label) }))
              .find((o) => o.value === field.state.value)}
            onSelect={(opt: Option) => handleGroupSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="subgroup"
        children={(field) => (
          <SelectSecondary
            label={t("device.subgroup")}
            options={subgroupOptions.map((o) => ({ ...o, label: t(o.label) }))}
            value={subgroupOptions
              .map((o) => ({ ...o, label: t(o.label) }))
              .find((o) => o.value === field.state.value)}
            onSelect={(opt: Option) => field.handleChange(opt.value)}
          />
        )}
      />
      <form.Subscribe selector={(state) => state.values.group}>
        {(group) =>
          group === "Computers" && (
            <form.Field
              name="assetName"
              validators={{
                onChange: ({ value }) => requiredValidator(value),
              }}
            >
              {(field) => (
                <Input
                  {...field}
                  value={field.state.value}
                  label={t("device.assetname")}
                  errors={field.state.meta.errors?.join(", ")}
                />
              )}
            </form.Field>
          )
        }
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.values.group}>
        {(group) =>
          group === "Network" && (
            <>
              <form.Field name="managementIp">
                {(field) => (
                  <Input
                    {...field}
                    value={field.state.value}
                    label={t("device.managementIp")}
                  />
                )}
              </form.Field>
              <form.Field name="portCount">
                {(field) => (
                  <Input
                    {...field}
                    value={field.state.value}
                    type="number"
                    label={t("device.portCount")}
                  />
                )}
              </form.Field>
              <form.Field name="firmwareVersion">
                {(field) => (
                  <Input
                    {...field}
                    value={field.state.value}
                    label={t("device.firmwareVersion")}
                  />
                )}
              </form.Field>
              <form.Field name="macAddress">
                {(field) => (
                  <Input
                    {...field}
                    value={field.state.value}
                    label={t("device.macAddress")}
                  />
                )}
              </form.Field>
            </>
          )
        }
      </form.Subscribe>
      <form.Field
        name="model"
        validators={{
          onChange: ({ value }) => requiredValidator(value),
        }}
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("device.model")}
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />

      <form.Field
        name="manufacturer"
        validators={{
          onChange: ({ value }) => requiredValidator(value),
        }}
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("device.manufacturer")}
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />

      <form.Field
        name="serialNumber"
        validators={{
          onChange: ({ value }) => requiredValidator(value),
        }}
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("device.serial.number")}
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />

      <form.Field
        name="locationId"
        children={(field) => {
          const locations = locationsQuery.data ?? [];
          const locationOptions = [
            { value: "", label: t("device.location.none") },
            ...locations.map((l) => ({ value: l.id, label: l.name })),
          ];
          return (
            <SelectSecondary
              label={t("device.location")}
              options={locationOptions}
              value={locationOptions.find((o) => o.value === field.state.value)}
              onSelect={(opt: Option) => {
                const loc = locations.find((l) => l.id === opt.value);
                field.handleChange(opt.value);
                form.setFieldValue("location", loc?.name ?? "");
              }}
            />
          );
        }}
      />
      <div className="pt-4">
        <ButtonPrimary
          icon={faPlus}
          type="submit"
          text={t("btn.add.device")}
          disabled={!form.state.canSubmit || mutation.isPending}
        />
      </div>
    </form>
  );
};

export default AddEquipmentForm;
