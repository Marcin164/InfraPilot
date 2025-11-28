import { useAuthInfo } from "@propelauth/react";
import React from "react";
import SelectSecondary from "../Inputs/SelectSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import Input from "../Inputs/Input";
import { assignDevice } from "../../Services/devices";
import { useParams } from "react-router";
import { getUsers } from "../../Services/users";
import { createHistory } from "../../Services/histories";

type Props = {};

const AssignUserForm = (props: Props) => {
  const authInfo = useAuthInfo();
  const params = useParams();
  const mutation = useMutation({
    mutationFn: (values: any) => (
      assignDevice(authInfo.accessToken, {
        deviceId: params.id,
        ownerId: values.user,
      }),
      createHistory(authInfo.accessToken, {
        approvers: values.approvers,
        date: values.date,
        justification: values.justification,
        details: values.details,
        ticket: values.ticket,
        device: params.id,
        userId: values.user,
      })
    ),
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(authInfo.accessToken),
  });

  const form = useForm({
    defaultValues: {
      user: "",
      ticket: "",
      justification: "",
      details: "",
      approvers: "",
      date: "",
    },
    onSubmit: async ({ value }: any) => {
      mutation.mutate(value);
    },
  });

  if (!usersQuery.data) return null;

  const convertToOptions = () => {
    return usersQuery.data.map((user: any) => {
      return {
        value: user.id,
        label: `${user.distinguishedName} (${user.email})`,
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
        name="user"
        children={(field) => (
          <SelectSecondary
            label="User"
            options={convertToOptions()}
            onSelect={(e: any) => field.handleChange(e.value)}
            value={""}
          />
        )}
      />
      <form.Field
        name="ticket"
        children={(field) => <Input {...field} label="Ticket" />}
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
            options={convertToOptions()}
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

export default AssignUserForm;
