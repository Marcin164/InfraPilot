import { useAuthInfo } from "@propelauth/react";
import SelectSecondary from "../Inputs/SelectSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Input from "../Inputs/Input";
import { useParams } from "react-router";
import { getUsers } from "../../Services/users";
import { createHistoryEntry } from "../../Services/histories";
import { toast } from "react-toastify";

type Props = { close: any };

const AssignUserForm = ({ close }: Props) => {
  const authInfo = useAuthInfo();
  const params = useParams();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: any) =>
      createHistoryEntry(authInfo.accessToken, {
        approvers: values.approvers,
        date: values.date,
        justification: values.justification,
        details: values.details,
        deviceId: params.id,
        type: "owner change",
      }),

    onSuccess: () => {
      toast.success("Owner has been changed successfully");
      queryClient.invalidateQueries({ queryKey: ["history"] });
      close();
    },

    onError: () => {
      toast.error("Cannot change owner");
    },
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
        validators={{
          onChange: ({ value }) =>
            !value || value === "" ? "Field required" : null,
        }}
        children={(field) => (
          <SelectSecondary
            label="User"
            options={convertToOptions()}
            onSelect={(e: any) => field.handleChange(e.value)}
            value={""}
            errors={
              !field.state.meta.isValid && field.state.meta.errors.join(", ")
            }
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
            options={convertToOptions()}
            onSelect={(e: any) => field.handleChange(e.value)}
            value={null}
            isMulti
          />
        )}
      />
      <form.Field
        name="date"
        validators={{
          onChange: ({ value }) =>
            !value || value === "" ? "Field required" : null,
        }}
        children={(field) => (
          <Input
            {...field}
            defaultValue={new Date().toISOString().split("T")[0]}
            type="date"
            label="Date"
          />
        )}
      />
      <ButtonPrimary type="submit" text="Assign" className="mt-4" />
    </form>
  );
};

export default AssignUserForm;
