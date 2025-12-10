import { useAuthInfo } from "@propelauth/react";
import { useForm } from "@tanstack/react-form";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import React, { useState } from "react";
import { useOutletContext, useParams } from "react-router";
import SelectSecondary from "../Inputs/SelectSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import Input from "../Inputs/Input";
import Checkbox from "../Inputs/Checkbox";
import { createHistoryEntry } from "../../Services/histories";
import {
  componentsTypeOptions,
  historyTypeOptions,
} from "../../Constants/options";
import { addDevice, getDevices } from "../../Services/devices";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";

type Props = {};

const ApplyChangeForm = (props: Props) => {
  const params = useParams();
  const authInfo = useAuthInfo();
  const queryClient = useQueryClient();
  const deviceContext: any = useOutletContext();
  const [historyType, setHistoryType] = useState(1);
  const mutation = useMutation({
    mutationFn: async (history: any) => {
      let devices = [];

      if (history.removedComponents.length > 0) {
        devices = await Promise.all(
          history.removedComponents.map((component: any) =>
            addDevice(authInfo.accessToken, {
              ...component,
              location: deviceContext.data.location,
              group: "Components",
            })
          )
        );
      }

      const historyResponse = createHistoryEntry(authInfo.accessToken, {
        deviceId: params.id,
        ...history,
        removedComponents: history.removedComponents.map(
          (component: any, index: any) => {
            console.log(history.removedComponents);
            return {
              ...component,
              deviceId: devices[index],
            };
          }
        ),
      });

      return {
        devices,
        historyResponse,
      };
    },

    onSuccess: () => {
      toast.success("Change has been applied uccessfully");
      queryClient.invalidateQueries({ queryKey: ["history"] });
      close();
    },

    onError: () => {
      toast.error("Cannot change owner");
    },
  });

  const deviceQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices(authInfo.accessToken),
  });

  const form = useForm({
    defaultValues: {
      device: "",
      ticket: "",
      fixes: "",
      damages: "",
      isUserFault: false,
      removedComponents: [
        {
          subgroup: "RAM",
          serialNumber: "",
          manufacturer: "",
          model: "",
          type: "remove",
        },
      ],
      addedComponents: "",
      agent: "",
      date: "",
      details: "",
      justification: "",
      type: 1,
    },
    onSubmit: async ({ value }) => {
      const sanitized = Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          val === "" ? null : val,
        ])
      );

      mutation.mutate(sanitized);
    },
  });

  const convertDevicesToOptions = () => {
    const components = deviceQuery.data.filter(
      (device: any) => device.group === "Components"
    );
    return components.map((device: any) => {
      return {
        label: `${device.manufacturer} ${device.model} (${device.serialNumber})`,
        value: device.id,
      };
    });
  };

  const changeHistoryType = (type: number) => {
    setHistoryType(type);
  };

  const agentsOptions = [
    {
      label: "Marcin Nowakowski",
      value: "1",
    },
    {
      label: "Agent 2",
      value: "2",
    },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="type"
        children={(field) => (
          <SelectSecondary
            label="Type"
            options={historyTypeOptions}
            onSelect={(e: any) => {
              changeHistoryType(e.value);
              field.handleChange(e.value);
            }}
            defaultValue={historyTypeOptions[0]}
          />
        )}
      />
      {historyType === 1 && (
        <form.Field
          name="isUserFault"
          children={(field) => (
            <Checkbox {...field} label="User fault" className="mt-4" />
          )}
        />
      )}
      {historyType === 1 && (
        <form.Field
          validators={{
            onChange: ({ value }) =>
              !value || value === "" ? "Field required" : null,
          }}
          name="damages"
          children={(field) => (
            <Input
              {...field}
              label="Damages"
              errors={
                !field.state.meta.isValid && field.state.meta.errors.join(", ")
              }
            />
          )}
        />
      )}
      {historyType === 1 && (
        <form.Field
          validators={{
            onChange: ({ value }) =>
              !value || value === "" ? "Field required" : null,
          }}
          name="fixes"
          children={(field) => (
            <Input
              {...field}
              label="Fixes"
              errors={
                !field.state.meta.isValid && field.state.meta.errors.join(", ")
              }
            />
          )}
        />
      )}
      {historyType === 3 && (
        <form.Field name="removedComponents" mode="array">
          {(field) => {
            return (
              <div>
                {field.state.value.map((_, i) => {
                  return (
                    <div key={i} className="flex justify-between">
                      <form.Field name={`removedComponents[${i}].subgroup`}>
                        {(subField) => {
                          return (
                            <SelectSecondary
                              label="Component"
                              className="w-[170px]"
                              onSelect={(e: any) => {
                                subField.handleChange(e.value);
                              }}
                              options={componentsTypeOptions}
                              defaultValue={componentsTypeOptions[0]}
                            />
                          );
                        }}
                      </form.Field>
                      <form.Field
                        name={`removedComponents[${i}].serialNumber`}
                        validators={{
                          onChange: ({ value }) =>
                            !value || value === "" ? "Field required" : null,
                        }}
                      >
                        {(subField) => {
                          return (
                            <Input
                              label="Serial number"
                              value={subField.state.value}
                              onChange={(e: any) =>
                                subField.handleChange(e.target.value)
                              }
                              className="w-[120px]"
                              errors={
                                !subField.state.meta.isValid &&
                                subField.state.meta.errors.join(", ")
                              }
                            />
                          );
                        }}
                      </form.Field>
                      <form.Field
                        name={`removedComponents[${i}].manufacturer`}
                        validators={{
                          onChange: ({ value }) =>
                            !value || value === "" ? "Field required" : null,
                        }}
                      >
                        {(subField) => {
                          return (
                            <Input
                              label="Manufacturer"
                              value={subField.state.value}
                              className="w-[140px]"
                              onChange={(e: any) =>
                                subField.handleChange(e.target.value)
                              }
                              errors={
                                !subField.state.meta.isValid &&
                                subField.state.meta.errors.join(", ")
                              }
                            />
                          );
                        }}
                      </form.Field>
                      <form.Field
                        name={`removedComponents[${i}].model`}
                        validators={{
                          onChange: ({ value }) =>
                            !value || value === "" ? "Field required" : null,
                        }}
                      >
                        {(subField) => {
                          return (
                            <Input
                              label="Model"
                              value={subField.state.value}
                              onChange={(e: any) =>
                                subField.handleChange(e.target.value)
                              }
                              errors={
                                !subField.state.meta.isValid &&
                                subField.state.meta.errors.join(", ")
                              }
                            />
                          );
                        }}
                      </form.Field>
                      <FontAwesomeIcon
                        icon={faTrashAlt}
                        className="text-[#BC0E0E] cursor-pointer my-auto"
                        onClick={() => field.removeValue(i)}
                      />
                    </div>
                  );
                })}
                <ButtonPrimary
                  onClick={() =>
                    field.pushValue({
                      subgroup: "RAM",
                      serialNumber: "",
                      manufacturer: "",
                      model: "",
                      type: "remove",
                    })
                  }
                  className="mt-4"
                  type="button"
                  text="Add removed component"
                />
              </div>
            );
          }}
        </form.Field>
      )}
      {historyType === 3 && (
        <form.Field
          name="addedComponents"
          children={(field) => (
            <SelectSecondary
              label="Added components"
              options={convertDevicesToOptions()}
              isMulti={true}
              onSelect={(e: any) => {
                field.handleChange(
                  e.length > 0 && e.map((component: any) => component.value)
                );
              }}
            />
          )}
        />
      )}
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
        name="agent"
        children={(field) => (
          <SelectSecondary
            label="Agent"
            options={agentsOptions}
            onSelect={(e: any) => {
              field.handleChange(e.value);
            }}
          />
        )}
      />
      <form.Field
        name="date"
        // validators={{
        //   onChange: ({ value }) =>
        //     !value || value === "" ? "Field required" : null,
        // }}
        children={(field) => (
          <Input
            {...field}
            type="date"
            // defaultValue={new Date().toISOString().split("T")[0]}
            label="Date"
            errors={
              !field.state.meta.isValid && field.state.meta.errors.join(", ")
            }
          />
        )}
      />
      <ButtonPrimary type="submit" text="Apply" className="mt-4" />
    </form>
  );
};

export default ApplyChangeForm;
