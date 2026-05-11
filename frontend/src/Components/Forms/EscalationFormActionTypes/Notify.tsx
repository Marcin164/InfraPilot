import React from "react";
import { useTranslation } from "react-i18next";
import SelectSecondary from "../../Inputs/SelectSecondary";
import { requiredValidator } from "../../../Helpers/validators";
import Input from "../../Inputs/Input";

type Props = { form: any; actionConfig?: any };

const Notify = ({ form }: Props) => {
  const { t } = useTranslation();
  const channelOptions = [
    { value: "email", label: t("form.notify.email") },
    { value: "sms", label: t("form.notify.sms") },
    { value: "teams", label: t("form.notify.teams") },
    // { value: "discord", label: "Discord" },
    // { value: "slack", label: "Slack" },
    // { value: "webhook", label: "Webhook" },
  ];

  return (
    <>
      <form.Field
        name="actionConfig.channel"
        children={(field: any) => (
          <SelectSecondary
            label="Channel"
            options={channelOptions}
            value={channelOptions.find(
              (option: any) => option.value === field.state.value,
            )}
            onSelect={(value: any) => field.handleChange(value.value)}
          />
        )}
      />
      <form.Field
        name="actionConfig.recipients"
        validators={{
          onChange: ({ value }: any) => requiredValidator(value),
        }}
        children={(field: any) => (
          <Input
            {...field}
            value={field?.state?.value}
            label="Recipients"
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />
    </>
  );
};

export default Notify;
