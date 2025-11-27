import { useForm } from "@tanstack/react-form";
import React from "react";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useMutation, useQuery } from "@tanstack/react-query";
import { assignDevice, getDevicesOptions } from "../../Services/devices";
import { useAuthInfo } from "@propelauth/react";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useParams } from "react-router";

type Props = {};

const AssignDeviceForm = (props: Props) => {
  const params = useParams();
  const authInfo = useAuthInfo();
  const mutation = useMutation({
    mutationFn: (device: any) =>
      assignDevice(authInfo.accessToken, {
        deviceId: device?.device,
        ownerId: params.id,
      }),
  });

  const form = useForm({
    defaultValues: {
      device: "",
    },
    onSubmit: async ({ value }: any) => {
      console.log(value);
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
        name="device"
        children={(field) => (
          <SelectSecondary
            label="Device"
            options={convertToOptions()}
            onSelect={(e: any) => field.handleChange(e.value)}
            value={""}
          />
        )}
      />
      <ButtonPrimary type="submit" text="Assign" className="mt-4" />
    </form>
  );
};

export default AssignDeviceForm;
