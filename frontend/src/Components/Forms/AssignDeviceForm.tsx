import { useForm } from "@tanstack/react-form";
import React from "react";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignDevice, getDevicesOptions } from "../../Services/devices";
import { useAuthInfo } from "@propelauth/react";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useParams } from "react-router";
import Input from "../Inputs/Input";
import { toast } from "react-toastify";
import { createHistoryEntry } from "../../Services/histories";

type Props = {};

const AssignDeviceForm = (props: Props) => {
  const params = useParams();
  const authInfo = useAuthInfo();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (device: any) => (
      createHistoryEntry(authInfo.accessToken, {
        ...device,
        userId: params.id,
        type: 0,
      }),
      assignDevice(authInfo.accessToken, {
        deviceId: device?.deviceId,
        ownerId: params.id,
      })
    ),

    onSuccess: () => {
      toast.success("Owner has been changed successfully");
      queryClient.invalidateQueries({ queryKey: ["userDevice"] });
    },

    onError: () => {
      toast.error("Cannot change owner");
    },
  });

  const form = useForm({
    defaultValues: {
      deviceId: "",
      ticket: "",
      details: "",
      justification: "",
      approvers: "",
      date: "",
    },
    onSubmit: async ({ value }: any) => {
      mutation.mutate(value);
    },
  });

  const devices = useQuery({
    queryKey: ["devicesOptions"],
    queryFn: () => getDevicesOptions(authInfo.accessToken),
  });

  if (!devices.data) return null;

  const convertToOptions = () => {
    return devices.data.map((device: any) => {
      return {
        label: `${device.manufacturer} ${device.model} (${device.serialnumber})`,
        value: device.id,
      };
    });
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
        name="deviceId"
        children={(field) => (
          <SelectSecondary
            label="Device"
            options={convertToOptions()}
            onSelect={(e: any) => field.handleChange(e.value)}
            value={""}
          />
        )}
      />
      <form.Field
        name="ticket"
        children={(field) => (
          <Input
            {...field}
            label="Ticket"
            errors={
              !field.state.meta.isValid && field.state.meta.errors.join(", ")
            }
          />
        )}
      />
      <form.Field
        name="justification"
        children={(field) => <Input {...field} label="Justification" />}
      />
      <form.Field
        name="details"
        children={(field) => <Input {...field} label="Details" />}
      />
      <form.Field
        name="approvers"
        children={(field) => (
          <SelectSecondary
            label="Approvers"
            options={[]}
            onSelect={(e: any) => field.handleChange(e.value)}
            value={null}
            isMulti
          />
        )}
      />
      <form.Field
        name="date"
        children={(field) => <Input {...field} type="date" label="Date" />}
      />
      <ButtonPrimary type="submit" text="Assign" className="mt-4" />
    </form>
  );
};

export default AssignDeviceForm;
