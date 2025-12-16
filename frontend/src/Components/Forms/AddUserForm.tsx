import { useForm } from "@tanstack/react-form";
import React from "react";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useAuthInfo } from "@propelauth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addUserDefaultValues } from "../../Constants/defaultValues";
import { addUser } from "../../Services/users";
import { toast } from "react-toastify";

type Props = { close: any };

const AddUserForm = ({ close }: Props) => {
  const { accessToken } = useAuthInfo();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (user: Record<string, any>) => {
      if (!accessToken) throw new Error("User is not authenticated.");
      addUser(accessToken, user);
    },

    onSuccess: () => {
      toast.success("User has been added uccessfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      close();
    },
  });

  const form = useForm({
    defaultValues: addUserDefaultValues,

    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
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
        name="name"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Name" />
        )}
      />
      <form.Field
        name="surname"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Surname" />
        )}
      />
      <form.Field
        name="username"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Username" />
        )}
      />
      <form.Field
        name="email"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Email" />
        )}
      />
      <form.Field
        name="title"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Title" />
        )}
      />
      <form.Field
        name="department"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Department" />
        )}
      />
      <form.Field
        name="company"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Company" />
        )}
      />
      <form.Field
        name="office"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Office" />
        )}
      />
      <form.Field
        name="streetAddress"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Street" />
        )}
      />
      <form.Field
        name="city"
        children={(field) => (
          <Input {...field} value={field.state.value} label="City" />
        )}
      />
      <form.Field
        name="postalCode"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Postal Code" />
        )}
      />
      <form.Field
        name="country"
        children={(field) => (
          <Input {...field} value={field.state.value} label="Country" />
        )}
      />
      <ButtonPrimary type="submit" text="Add user" className="mt-4" />
    </form>
  );
};

export default AddUserForm;
