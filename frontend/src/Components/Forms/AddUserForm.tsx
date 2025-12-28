import React from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import Input from "../Inputs/Input";
import ButtonPrimary from "../Buttons/ButtonPrimary";

import { addUser } from "../../Services/users";
import { addUserDefaultValues } from "../../Constants/defaultValues";
import { requiredValidator } from "../../Helpers/validators";

type AddUserFormProps = {
  close: () => void;
};

type FormValues = typeof addUserDefaultValues;

type FieldConfig<TForm> = {
  name: keyof TForm;
  label: string;
  required?: boolean;
  Component: React.FC<any>;
};

const AddUserForm: React.FC<AddUserFormProps> = ({ close }) => {
  const { t } = useTranslation();
  const { accessToken } = useAuthInfo();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!accessToken) {
        throw new Error("User is not authenticated");
      }
      return addUser(accessToken, values);
    },

    onSuccess: () => {
      toast.success(t("user.addSuccess"));
      queryClient.invalidateQueries({ queryKey: ["users"] });
      close();
    },
  });

  const form = useForm({
    defaultValues: addUserDefaultValues,

    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
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
      <ButtonPrimary
        type="submit"
        text={t("user.add")}
        className="mt-4"
        disabled={!form.state.canSubmit || mutation.isPending}
      />
    </form>
  );
};

export default AddUserForm;
