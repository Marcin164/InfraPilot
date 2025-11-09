import { useForm } from "@tanstack/react-form";
import React from "react";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useQuery } from "@tanstack/react-query";
import { getDevicesOptions } from "../../Services/devices";
import { useAuthInfo } from "@propelauth/react";

type Props = {};

const AssignDeviceForm = (props: Props) => {
  const authInfo = useAuthInfo();
  const form = useForm({
    defaultValues: {
      device: "",
    },
    onSubmit: async ({ value }: any) => {
      //   mutation.mutate(value);
    },
  });
  const devices = useQuery({
    queryKey: ["devicesOptions"],
    queryFn: () => getDevicesOptions(authInfo.accessToken),
  });

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
            options={[]}
            onSelect={() => {}}
            value={""}
          />
        )}
      />
    </form>
  );
};

export default AssignDeviceForm;
