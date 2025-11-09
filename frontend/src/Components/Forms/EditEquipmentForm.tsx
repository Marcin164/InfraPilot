import React from "react";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

type Props = {
  serialNumber: any;
  model: any;
  manufacturer: any;
  location: any;
  ticket: any;
  justification: any;
  approvers: any;
};

const EditEquipmentForm = ({
  serialNumber,
  model,
  manufacturer,
  location,
  ticket,
  justification,
  approvers,
}: Props) => {
  const form = useForm({
    defaultValues: {
      serialNumber: serialNumber || "",
      model: model || "",
      manufacturer: manufacturer || "",
      location: location || "",
      ticket: ticket || "",
      justification: justification || "",
      approvers: approvers || "",
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex">
        <div className="w-[50%] mr-2">
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
        <div className="w-[50%] ml-2">
          <form.Field
            name="ticket"
            children={(field) => (
              <Input {...field} value={field.state.value} label="Ticket" />
            )}
          />
          <form.Field
            name="justification"
            children={(field) => (
              <Input
                {...field}
                value={field.state.value}
                label="Justification"
              />
            )}
          />
          <form.Field
            name="approvers"
            children={(field) => (
              <Input {...field} value={field.state.value} label="Approvers" />
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
