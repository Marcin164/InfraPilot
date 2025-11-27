import React from "react";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

type Props = {
  assetName: string;
  serialNumber: any;
  model: any;
  manufacturer: any;
  location: any;
};

const EditEquipmentForm = ({
  assetName,
  serialNumber,
  model,
  manufacturer,
  location,
}: Props) => {
  const form = useForm({
    defaultValues: {
      assetName: assetName || "",
      serialNumber: serialNumber || "",
      model: model || "",
      manufacturer: manufacturer || "",
      location: location || "",
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex">
        <div className="w-full mr-2">
          <form.Field
            name="assetName"
            children={(field) => (
              <Input {...field} value={field.state.value} label="Name" />
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
              <Input
                {...field}
                value={field.state.value}
                label="Manufacturer"
              />
            )}
          />
          <form.Field
            name="serialNumber"
            children={(field) => (
              <Input
                {...field}
                value={field.state.value}
                label="Serial Number"
              />
            )}
          />
          <form.Field
            name="location"
            children={(field) => (
              <Input {...field} value={field.state.value} label="Location" />
            )}
          />
        </div>
      </div>
      <div className="pt-4">
        <ButtonPrimary icon={faPlus} type="submit" text="Save" />
      </div>
    </form>
  );
};

export default EditEquipmentForm;
