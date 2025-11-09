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

type Props = { onFormComplete?: any };

const AddEquipmentForm = ({ onFormComplete }: Props) => {
  const [subgroupType, setSubgroupType] = useState(computersTypeOptions);
  const authInfo = useAuthInfo();
  const mutation = useMutation({
    mutationFn: (device) => addDevice(authInfo.accessToken, device),
  });
  const form = useForm({
    defaultValues: {
      group: "",
      subgroup: "",
      assetName: "",
      serialNumber: "",
      model: "",
      manufacturer: "",
      location: "",
    },
    onSubmit: async ({ value }: any) => {
      mutation.mutate(value);
      onFormComplete();
    },
  });

  const parseGroupAndSubgroup: any = [
    {
      group: "Computers",
      subgroupOptions: computersTypeOptions,
    },
    {
      group: "Peripherals",
      subgroupOptions: peripheralsTypeOptions,
    },
    {
      group: "Network",
      subgroupOptions: networkTypeOptions,
    },
    {
      group: "Components",
      subgroupOptions: componentsTypeOptions,
    },
    {
      group: "Others",
      subgroupOptions: othersTypeOptions,
    },
  ];

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
            onSelect={(e: any) => {
              setSubgroupType(
                parseGroupAndSubgroup.find(
                  ({ group }: any) => group === e.value
                )?.subgroupOptions
              );
              field.handleChange(e.value);
            }}
            value={groupTypeOptions[0]}
          />
        )}
      />
      <form.Field
        name="subgroup"
        children={(field) => (
          <SelectSecondary
            label="Subgroup"
            options={subgroupType}
            onSelect={(e: any) => field.handleChange(e.value)}
            value={subgroupType[0]}
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
