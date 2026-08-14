import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router";
import { toast } from "react-toastify";

import Input from "../Inputs/Input";
import TicketSelect from "../Inputs/TicketSelect";
import ButtonPrimary from "../Buttons/ButtonPrimary";

import { getUsers } from "../../Services/users";
import { getDevicesOptions, assignDevice } from "../../Services/devices";
import { createHistoryEntry } from "../../Services/histories";
import { assignDeviceDefaultValues } from "../../Constants/defaultValues";
import SelectSecondary from "../Inputs/SelectSecondary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import type { Ticket } from "../../Types/ticket";

type Option = {
  label: string;
  value: string;
};

type FormValues = typeof assignDeviceDefaultValues;

type Props = { close?: () => void };

const AssignDeviceForm: React.FC<Props> = ({ close }) => {
  const { t } = useTranslation();
  const { id: routeId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [loadedTicket, setLoadedTicket] = useState<Ticket | null>(null);

  const isUserContext = location.pathname.includes("/users/");
  const isDeviceContext = location.pathname.includes("/devices/");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });

  const devicesQuery = useQuery({
    queryKey: ["devicesOptions"],
    queryFn: () => getDevicesOptions(),
  });

  const userOptions: Option[] = useMemo(() => {
    if (!usersQuery.data) return [];
    return usersQuery.data
      .filter((u: any) => u?.isApprover)
      .map((u: any) => ({
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

      await createHistoryEntry({
        ...values,
        userId,
        deviceId,
        type: 0,
      });

      return assignDevice({
        userId,
        deviceId,
      });
    },

    onSuccess: () => {
      toast.success("Owner has been changed successfully");
      queryClient.invalidateQueries({
        queryKey: isUserContext ? ["userDevice"] : ["history"],
      });
      if (isDeviceContext) {
        queryClient.invalidateQueries({ queryKey: ["device"] });
      }
      close?.();
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
          <TicketSelect
            value={field.state.value}
            onChange={(val) => field.handleChange(val)}
            onTicketLoaded={(ticket) => {
              setLoadedTicket(ticket);
              if (ticket) {
                if (!form.getFieldValue("details")) {
                  form.setFieldValue("details", ticket.description ?? "");
                }
                if (!form.getFieldValue("approvers")?.length) {
                  form.setFieldValue(
                    "approvers",
                    (ticket.approvals ?? []).map((a) => a.approver.id),
                  );
                }
              }
            }}
            errors={
              !field.state.meta.isValid
                ? field.state.meta.errors.join(", ")
                : undefined
            }
          />
        )}
      />
      {loadedTicket && (
        <div className="mt-2 p-3 rounded-[10px] border border-[#3C3C3C33] bg-[#F5F7FA] text-[14px]">
          <div className="font-bold text-[#3C3C3C]">
            {loadedTicket.type} {loadedTicket.number}
            {loadedTicket.title ? ` — ${loadedTicket.title}` : ""}
          </div>
          <div className="text-[#3C3C3C99] mt-1">
            {t("helpdesk.field.state")}: {loadedTicket.state} ·{" "}
            {t("helpdesk.field.priority")}: {loadedTicket.priority} ·{" "}
            {t("helpdesk.column.requester")}:{" "}
            {loadedTicket.requester?.distinguishedName}
          </div>
          {loadedTicket.description && (
            <div className="text-[#3C3C3C] mt-1 line-clamp-3">
              {loadedTicket.description}
            </div>
          )}
        </div>
      )}
      <form.Field
        name="justification"
        children={(field) => (
          <Input
            name={field.name}
            value={field.state.value}
            onChange={(e: any) => field.handleChange(e.target.value)}
            label="Justification"
          />
        )}
      />
      <form.Field
        name="details"
        children={(field) => (
          <Input
            name={field.name}
            value={field.state.value}
            onChange={(e: any) => field.handleChange(e.target.value)}
            label="Details"
          />
        )}
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
            value={userOptions.filter((o) =>
              field.state.value.includes(o.value),
            )}
            isMulti
          />
        )}
      />
      <form.Field
        name="date"
        children={(field) => (
          <Input
            name={field.name}
            value={field.state.value}
            onChange={(e: any) => field.handleChange(e.target.value)}
            type="date"
            label="Date"
          />
        )}
      />
      <ButtonPrimary
        type="submit"
        text="Assign"
        className="mt-4"
        icon={faPlus}
        disabled={!form.state.canSubmit || mutation.isPending}
      />
    </form>
  );
};

export default AssignDeviceForm;
