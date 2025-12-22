import { useForm } from "@tanstack/react-form";
import React from "react";
import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useAuthInfo } from "@propelauth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addUserDefaultValues } from "../../Constants/defaultValues";
import { addUser } from "../../Services/users";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

type Props = { close: any };

const AddUserForm = ({ close }: Props) => {
  const { t } = useTranslation();
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
          <Input {...field} value={field.state.value} label={t("user.name")} />
        )}
      />
      <form.Field
        name="surname"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.surname")}
          />
        )}
      />
      <form.Field
        name="username"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.username")}
          />
        )}
      />
      <form.Field
        name="email"
        children={(field) => (
          <Input {...field} value={field.state.value} label={t("user.email")} />
        )}
      />
      <form.Field
        name="title"
        children={(field) => (
          <Input {...field} value={field.state.value} label={t("user.title")} />
        )}
      />
      <form.Field
        name="department"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.department")}
          />
        )}
      />
      <form.Field
        name="company"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.company")}
          />
        )}
      />
      <form.Field
        name="office"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.office")}
          />
        )}
      />
      <form.Field
        name="streetAddress"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.street")}
          />
        )}
      />
      <form.Field
        name="city"
        children={(field) => (
          <Input {...field} value={field.state.value} label={t("user.city")} />
        )}
      />
      <form.Field
        name="postalCode"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.postalcode")}
          />
        )}
      />
      <form.Field
        name="country"
        children={(field) => (
          <Input
            {...field}
            value={field.state.value}
            label={t("user.country")}
          />
        )}
      />
      <ButtonPrimary type="submit" text="Add user" className="mt-4" />
    </form>
  );
};

export default AddUserForm;
