import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useMutation } from "@tanstack/react-query";
import { addDevice } from "../../Services/devices";
import { useAuthInfo } from "@propelauth/react";

import {
  componentsTypeOptions,
  computersTypeOptions,
  groupTypeOptions,
  networkTypeOptions,
  othersTypeOptions,
  peripheralsTypeOptions,
} from "../../Constants/options";

import SelectSecondary from "../Inputs/SelectSecondary";

type Option = { label: string; value: string };

const GROUP_MAPPINGS: { group: string; subgroupOptions: Option[] }[] = [
  { group: "Computers", subgroupOptions: computersTypeOptions },
  { group: "Peripherals", subgroupOptions: peripheralsTypeOptions },
  { group: "Network", subgroupOptions: networkTypeOptions },
  { group: "Components", subgroupOptions: componentsTypeOptions },
  { group: "Others", subgroupOptions: othersTypeOptions },
];

const AddEquipmentForm: React.FC = () => {
  const { accessToken } = useAuthInfo();

  const [subgroupType, setSubgroupType] =
    useState<Option[]>(computersTypeOptions);

  const mutation = useMutation({
    mutationFn: async (device: Record<string, any>) => {
      if (!accessToken) throw new Error("User is not authenticated.");
      return addDevice(accessToken, device);
    },
  });

  const form = useForm({
    defaultValues: {
      group: groupTypeOptions[0]?.value ?? "",
      subgroup: computersTypeOptions[0]?.value ?? "",
      assetName: "",
      serialNumber: "",
      model: "",
      manufacturer: "",
      location: "",
    },

    onSubmit: async ({ value }) => {
      if (!value.assetName.trim()) return;
      if (!value.group || !value.subgroup) return;

      mutation.mutate(value);
    },
  });

  const handleGroupSelect = (option: Option, onChange: (v: string) => void) => {
    const mapping = GROUP_MAPPINGS.find((m) => m.group === option.value);
    const subgroups = mapping?.subgroupOptions ?? [];

    setSubgroupType(subgroups);
    onChange(option.value);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
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
            onSelect={(opt: Option) =>
              handleGroupSelect(opt, field.handleChange)
            }
          />
        )}
      />
      <form.Field
        name="subgroup"
        children={(field) => (
          <SelectSecondary
            label="Subgroup"
            options={subgroupType}
            value={subgroupType.find((o) => o.value === field.state.value)}
            onSelect={(opt: Option) => field.handleChange(opt.value)}
          />
        )}
      />
      <form.Field
        name="assetName"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Asset Name" />
        )}
      />

      <form.Field
        name="model"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Model" />
        )}
      />

      <form.Field
        name="manufacturer"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Manufacturer" />
        )}
      />

      <form.Field
        name="serialNumber"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Serial Number" />
        )}
      />

      <form.Field
        name="location"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Location" />
        )}
      />

      <div className="pt-4">
        <ButtonPrimary icon={faPlus} type="submit" text="Save" />
      </div>
    </form>
  );
};

export default AddEquipmentForm;
