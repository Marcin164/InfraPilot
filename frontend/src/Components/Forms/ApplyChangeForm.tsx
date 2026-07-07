import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import Input from "../Inputs/Input";
import TicketSelect from "../Inputs/TicketSelect";
import SelectSecondary from "../Inputs/SelectSecondary";
import Checkbox from "../Inputs/Checkbox";

import { createHistoryEntry } from "../../Services/histories";
import { addDevice, getDevices } from "../../Services/devices";
import type { Device } from "../../Types";
import {
  componentsTypeOptions,
  historyTypeOptions,
} from "../../Constants/options";
import { requiredValidator } from "../../Helpers/validators";
import { applyChangeDefaultValues } from "../../Constants/defaultValues";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Option = { label: string; value: string };

type FormValues = typeof applyChangeDefaultValues;

const ApplyChangeForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const deviceContext = useOutletContext<{ data: { location: string } }>();
  const trHistory = historyTypeOptions.map((o) => ({ ...o, label: t(o.label) }));
  const trComponents = componentsTypeOptions.map((o) => ({ ...o, label: t(o.label) }));

  const devicesQuery = useQuery<any>({
    queryKey: ["devices"],
    queryFn: () => getDevices(),
  });

  const addedComponentsOptions = useMemo(() => {
    if (!devicesQuery.data) return [];

    return devicesQuery?.data?.data
      ?.filter((d: any) => d.group === "Components")
      ?.map((d: any) => ({
        label: `${d.manufacturer} ${d.model} (${d.serialNumber})`,
        value: d.id,
      }));
  }, [devicesQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let createdDevices: Device[] = [];

      if (values.removedComponents.length > 0) {
        createdDevices = await Promise.all(
          values.removedComponents.map((component: any) => {
            // `type` ("remove") is history-tracking metadata (see the
            // removedComponents mapping below) -- not a device field, so it
            // must not be sent to POST /devices.
            const { type, ...deviceFields } = component;
            return addDevice({
              ...deviceFields,
              location: deviceContext.data.location,
              group: "Components",
            });
          }),
        );
      }

      return createHistoryEntry({
        deviceId: id,
        ...values,
        removedComponents: values.removedComponents.map(
          (component: any, index) => ({
            ...component,
            deviceId: createdDevices[index],
          }),
        ),
      });
    },

    onSuccess: () => {
      toast.success(t("toast.success.changeApplied"));
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },

    onError: () => {
      toast.error(t("toast.error.changeApply", "Cannot apply change"));
    },
  });

  const form = useForm({
    defaultValues: applyChangeDefaultValues,

    onSubmit: ({ value }) => {
      const sanitized = Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, v === "" ? null : v]),
      );

      mutation.mutate(sanitized as FormValues);
    },
  });

  const removedComponentFields = [
    "serialNumber",
    "manufacturer",
    "model",
  ] as const;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="type">
        {(field) => (
          <SelectSecondary
            label={t("form.type")}
            options={trHistory}
            defaultValue={trHistory[0]}
            onSelect={(opt: any) => field.handleChange(opt.value)}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.values.type}>
        {(type) => (
          <>
            {type === 1 && (
              <>
                <form.Field name="isUserFault">
                  {(field) => (
                    <Checkbox {...field} label={t("form.field.userFault", "User fault")} className="pt-4" />
                  )}
                </form.Field>
                <form.Field
                  name="damages"
                  validators={{
                    onChange: ({ value }) => requiredValidator(value),
                  }}
                >
                  {(field) => (
                    <Input
                      {...field}
                      label={t("form.field.damages", "Damages")}
                      errors={field.state.meta.errors?.join(", ")}
                    />
                  )}
                </form.Field>
                <form.Field
                  name="fixes"
                  validators={{
                    onChange: ({ value }) => requiredValidator(value),
                  }}
                >
                  {(field) => (
                    <Input
                      {...field}
                      label={t("form.field.fixes", "Fixes")}
                      errors={field.state.meta.errors?.join(", ")}
                    />
                  )}
                </form.Field>
              </>
            )}
            {type === 3 && (
              <>
                <form.Field name="removedComponents" mode="array">
                  {(field) => (
                    <>
                      {field.state.value.map((_, i) => (
                        <div key={i} className="flex gap-2">
                          <form.Field name={`removedComponents[${i}].subgroup`}>
                            {(f) => (
                              <SelectSecondary
                                label={t("form.field.component", "Component")}
                                options={trComponents}
                                onSelect={(e: Option) =>
                                  f.handleChange(e.value)
                                }
                              />
                            )}
                          </form.Field>
                          {removedComponentFields.map((key) => (
                            <form.Field
                              key={key}
                              name={`removedComponents[${i}].${key}`}
                              validators={{
                                onChange: ({ value }) =>
                                  requiredValidator(value),
                              }}
                            >
                              {(f) => (
                                <Input
                                  label={key}
                                  value={f.state.value}
                                  onChange={(e: any) =>
                                    f.handleChange(e.target.value)
                                  }
                                  errors={f.state.meta.errors?.join(", ")}
                                />
                              )}
                            </form.Field>
                          ))}
                          <FontAwesomeIcon
                            icon={faTrashAlt}
                            className="text-red-600 cursor-pointer mt-7"
                            onClick={() => field.removeValue(i)}
                          />
                        </div>
                      ))}

                      <ButtonPrimary
                        type="button"
                        icon={faPlus}
                        text={t("form.field.addRemovedComponent", "Add removed component")}
                        className="mt-4"
                        onClick={() =>
                          field.pushValue({
                            subgroup: "RAM",
                            serialNumber: "",
                            manufacturer: "",
                            model: "",
                            type: "remove",
                          })
                        }
                      />
                    </>
                  )}
                </form.Field>

                {/* ADDED COMPONENTS */}
                <form.Field name="addedComponents">
                  {(field) => (
                    <SelectSecondary
                      label={t("form.field.addedComponents", "Added components")}
                      options={addedComponentsOptions}
                      isMulti
                      onSelect={(e: Option[]) =>
                        field.handleChange(e.map((c: any) => c.value))
                      }
                    />
                  )}
                </form.Field>
              </>
            )}
          </>
        )}
      </form.Subscribe>
      <form.Field name="ticket">
        {(field) => (
          <TicketSelect
            value={field.state.value}
            onChange={(val) => field.handleChange(val)}
          />
        )}
      </form.Field>
      <form.Field name="justification">
        {(field) => <Input {...field} label={t("form.field.justification")} />}
      </form.Field>
      <form.Field name="details">
        {(field) => <Input {...field} label={t("form.field.details")} />}
      </form.Field>
      <form.Field name="agent">
        {(field) => (
          <SelectSecondary
            label={t("form.field.agent", "Agent")}
            options={[
              { label: "Marcin Nowakowski", value: "1" },
              { label: "Agent 2", value: "2" },
            ]}
            onSelect={(e: Option) => field.handleChange(e.value)}
          />
        )}
      </form.Field>

      <form.Field name="date">
        {(field) => <Input {...field} type="date" label={t("form.field.date")} />}
      </form.Field>

      <ButtonPrimary
        type="submit"
        text={t("common.apply")}
        className="mt-4"
        disabled={!form.state.canSubmit || mutation.isPending}
      />
    </form>
  );
};

export default ApplyChangeForm;
