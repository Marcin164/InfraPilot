import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDevice } from "../../Services/devices";
import { useAuthInfo } from "@propelauth/react";
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

type Option = { label: string; value: string };

type FormValues = typeof addDeviceDefaultValues;

const AddEquipmentForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthInfo();

  const [subgroupOptions, setSubgroupOptions] =
    useState<Option[]>(computersTypeOptions);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!accessToken) {
        throw new Error("User is not authenticated");
      }
      return addDevice(accessToken, values);
    },

    onSuccess: () => {
      toast.success("device added successfully");
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
            label="Group"
            options={groupTypeOptions}
            value={groupTypeOptions.find((o) => o.value === field.state.value)}
            onSelect={(opt: Option) => handleGroupSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="subgroup"
        children={(field) => (
          <SelectSecondary
            label="Subgroup"
            options={subgroupOptions}
            value={subgroupOptions.find((o) => o.value === field.state.value)}
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
                  label="Asset Name"
                  errors={field.state.meta.errors?.join(", ")}
                />
              )}
            </form.Field>
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
            label="Model"
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
            label="Manufacturer"
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
            label="Serial Number"
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />

      <form.Field
        name="location"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Location" />
        )}
      />
      <div className="pt-4">
        <ButtonPrimary
          icon={faPlus}
          type="submit"
          text="Save"
          disabled={!form.state.canSubmit || mutation.isPending}
        />
      </div>
    </form>
  );
};

export default AddEquipmentForm;
