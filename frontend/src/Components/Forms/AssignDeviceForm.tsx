import React, { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { useLocation, useParams } from "react-router";
import { toast } from "react-toastify";

import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";

import { getUsers } from "../../Services/users";
import { getDevicesOptions, assignDevice } from "../../Services/devices";
import { createHistoryEntry } from "../../Services/histories";
import { assignDeviceDefaultValues } from "../../Constants/defaultValues";
import { t } from "i18next";
import { assignDeviceFormFields } from "../../Constants/forms";
import SelectSecondary from "../Inputs/SelectSecondary";
import { requiredValidator } from "../../Helpers/validators";

/* ---------------------------------- */
/* Types & helpers */
/* ---------------------------------- */

type FieldConfig<TForm> = {
  name: keyof TForm;
  label: string;
  required?: boolean;
  Component: React.FC<any>;
  props?: Record<string, unknown>;
  showIf?: (ctx: {
    isUserContext: boolean;
    isDeviceContext: boolean;
  }) => boolean;
};

type Props = {
  close: any;
};

type Option = {
  label: string;
  value: string;
};

type FormValues = typeof assignDeviceDefaultValues;

const AssignDeviceForm: React.FC<Props> = ({ close }: Props) => {
  const { accessToken } = useAuthInfo();
  const { id: routeId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isUserContext = location.pathname.includes("/users/");
  const isDeviceContext = location.pathname.includes("/devices/");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(accessToken),
    enabled: isDeviceContext,
  });

  const devicesQuery = useQuery({
    queryKey: ["devicesOptions"],
    queryFn: () => getDevicesOptions(accessToken),
    enabled: isUserContext,
  });

  const userOptions: Option[] = useMemo(() => {
    if (!usersQuery.data) return [];
    return usersQuery.data.map((u: any) => ({
      value: u.id,
      label: `${u.distinguishedName} (${u.email})`,
    }));
  }, [usersQuery.data]);

  const deviceOptions: Option[] = useMemo(() => {
    if (!devicesQuery.data) return [];
    return devicesQuery.data.map((d: any) => ({
      value: d.id,
      label: `${d.manufacturer} ${d.model} (${d.serialnumber})`,
    }));
  }, [devicesQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!routeId) {
        throw new Error("Missing route id");
      }

      const userId = isUserContext ? routeId : values?.userId;
      const deviceId = isDeviceContext ? routeId : values?.deviceId;

      await createHistoryEntry(accessToken, {
        ...values,
        userId,
        deviceId,
        type: 0,
      });

      return assignDevice(accessToken, {
        userId,
        deviceId,
      });
    },

    onSuccess: () => {
      toast.success("Owner has been changed successfully");
      queryClient.invalidateQueries({
        queryKey: isUserContext ? ["userDevice"] : ["history"],
      });
      close();
    },

    onError: () => {
      toast.error("Cannot change owner");
    },
  });

  const form = useForm({
    defaultValues: assignDeviceDefaultValues,

    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const getApproversIds = (options: any) => {
    return options.map((option: any) => option.value);
  };

  if (
    (isUserContext && devicesQuery.isLoading) ||
    (isDeviceContext && usersQuery.isLoading)
  ) {
    return null;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {isUserContext && (
        <form.Field
          name="deviceId"
          children={(field) => (
            <SelectSecondary
              label="Device"
              options={deviceOptions}
              onSelect={(e: any) => field.handleChange(e.value)}
              value={""}
            />
          )}
        />
      )}
      {isDeviceContext && (
        <form.Field
          name="userId"
          children={(field) => (
            <SelectSecondary
              label="User"
              options={userOptions}
              onSelect={(e: any) => field.handleChange(e.value)}
              value={""}
            />
          )}
        />
      )}
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
            options={userOptions}
            onSelect={(options: any) =>
              field.handleChange(getApproversIds(options))
            }
            value={null}
            isMulti
          />
        )}
      />
      <form.Field
        name="date"
        children={(field) => <Input {...field} type="date" label="Date" />}
      />

      <ButtonPrimary
        type="submit"
        text="Assign"
        className="mt-4"
        disabled={!form.state.canSubmit || mutation.isPending}
      />
    </form>
  );
};

export default AssignDeviceForm;
