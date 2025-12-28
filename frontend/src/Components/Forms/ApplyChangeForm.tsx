import React, { useMemo } from "react";
import { useAuthInfo } from "@propelauth/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import Input from "../Inputs/Input";
import SelectSecondary from "../Inputs/SelectSecondary";
import Checkbox from "../Inputs/Checkbox";
import ButtonPrimary from "../Buttons/ButtonPrimary";

import { createHistoryEntry } from "../../Services/histories";
import { addDevice, getDevices } from "../../Services/devices";
import {
  componentsTypeOptions,
  historyTypeOptions,
} from "../../Constants/options";
import { requiredValidator } from "../../Helpers/validators";
import { applyChangeDefaultValues } from "../../Constants/defaultValues";
import ButtonSecondary from "../Buttons/ButtonSecondary";

type Option = { label: string; value: string };

type FormValues = typeof applyChangeDefaultValues;

const ApplyChangeForm: React.FC = () => {
  const { id } = useParams();
  const { accessToken } = useAuthInfo();
  const queryClient = useQueryClient();
  const deviceContext = useOutletContext<{ data: { location: string } }>();

  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices(accessToken),
  });

  const addedComponentsOptions = useMemo(() => {
    if (!devicesQuery.data) return [];

    return devicesQuery.data
      .filter((d: any) => d.group === "Components")
      .map((d: any) => ({
        label: `${d.manufacturer} ${d.model} (${d.serialNumber})`,
        value: d.id,
      }));
  }, [devicesQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let createdDevices: string[] = [];

      if (values.removedComponents.length > 0) {
        createdDevices = await Promise.all(
          values.removedComponents.map((component: any) =>
            addDevice(accessToken, {
              ...component,
              location: deviceContext.data.location,
              group: "Components",
            })
          )
        );
      }

      return createHistoryEntry(accessToken, {
        deviceId: id,
        ...values,
        removedComponents: values.removedComponents.map(
          (component: any, index) => ({
            ...component,
            deviceId: createdDevices[index],
          })
        ),
      });
    },

    onSuccess: () => {
      toast.success("Change has been applied successfully");
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },

    onError: () => {
      toast.error("Cannot apply change");
    },
  });

  const form = useForm({
    defaultValues: applyChangeDefaultValues,

    onSubmit: ({ value }) => {
      const sanitized = Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, v === "" ? null : v])
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
            label="Type"
            options={historyTypeOptions}
            defaultValue={historyTypeOptions[0]}
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
                    <Checkbox {...field} label="User fault" className="pt-4" />
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
                      label="Damages"
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
                      label="Fixes"
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
                                label="Component"
                                options={componentsTypeOptions}
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

                      <ButtonSecondary
                        type="button"
                        icon={faPlus}
                        text="Add removed component"
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
                      label="Added components"
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
        {(field) => <Input {...field} label="Ticket" />}
      </form.Field>
      <form.Field name="justification">
        {(field) => <Input {...field} label="Justification" />}
      </form.Field>
      <form.Field name="details">
        {(field) => <Input {...field} label="Details" />}
      </form.Field>
      <form.Field name="agent">
        {(field) => (
          <SelectSecondary
            label="Agent"
            options={[
              { label: "Marcin Nowakowski", value: "1" },
              { label: "Agent 2", value: "2" },
            ]}
            onSelect={(e: Option) => field.handleChange(e.value)}
          />
        )}
      </form.Field>

      <form.Field name="date">
        {(field) => <Input {...field} type="date" label="Date" />}
      </form.Field>

      <ButtonPrimary
        type="submit"
        text="Apply"
        className="mt-4"
        disabled={!form.state.canSubmit || mutation.isPending}
      />
    </form>
  );
};

export default ApplyChangeForm;
