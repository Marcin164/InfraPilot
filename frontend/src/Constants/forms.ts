import Input from "../Components/Inputs/Input";
import TicketSelect from "../Components/Inputs/TicketSelect";
import SelectSecondary from "../Components/Inputs/SelectSecondary";
type Option = {
  label: string;
  value: string;
};

export const assignDeviceFormFields = (
  userOptions: any,
  deviceOptions: any,
) => {
  return [
    {
      name: "userId",
      label: "form.field.user",
      required: true,
      Component: SelectSecondary,
      showIf: ({ isDeviceContext }: any) => isDeviceContext,
      props: {
        options: userOptions,
        isMulti: false,
        onSelect: (option: Option, field: any) =>
          field.handleChange(option.value),
      },
    },
    {
      name: "deviceId",
      label: "form.field.device",
      required: true,
      Component: SelectSecondary,
      showIf: ({ isUserContext }: any) => isUserContext,
      props: {
        options: deviceOptions,
        isMulti: false,
        onSelect: (option: Option, field: any) =>
          field.handleChange(option.value),
      },
    },
    {
      name: "ticket",
      label: "form.field.ticket",
      Component: TicketSelect,
      props: {
        onChange: (value: string, field: any) => field.handleChange(value),
      },
    },
    {
      name: "justification",
      label: "form.field.justification",
      Component: Input,
    },
    {
      name: "details",
      label: "form.field.details",
      Component: Input,
    },
    {
      name: "approvers",
      label: "form.field.approvers",
      Component: SelectSecondary,
      props: {
        options: userOptions,
        isMulti: true,
        onSelect: (options: Option[], field: any) =>
          field.handleChange(options.map((o) => o.value)),
      },
    },
    {
      name: "date",
      label: "form.field.date",
      Component: Input,
      props: {
        type: "date",
      },
    },
  ];
};

export const addEquipmentFormFields = (
  groupOptions: any,
  subgroupOptions: any,
  handleGroupSelect: any,
) => {
  return [
    {
      name: "group",
      label: "form.field.group",
      required: true,
      Component: SelectSecondary,
      props: {
        options: groupOptions,
        isMulti: false,
        onSelect: (option: Option, field: any) =>
          handleGroupSelect(option, field),
      },
    },
    {
      name: "subgroup",
      label: "form.field.subgroup",
      required: true,
      Component: SelectSecondary,
      props: {
        options: subgroupOptions,
        isMulti: false,
        onSelect: (option: Option, field: any) =>
          field.handleChange(option.value),
      },
    },
    {
      name: "assetName",
      label: "form.field.assetName",
      Component: Input,
    },
    {
      name: "model",
      label: "form.field.model",
      required: true,
      Component: Input,
    },
    {
      name: "manufacturer",
      label: "form.field.manufacturer",
      required: true,
      Component: Input,
    },
    {
      name: "serialNumber",
      label: "form.field.serialNumber",
      required: true,
      Component: Input,
    },
    {
      name: "location",
      label: "form.field.location",
      Component: Input,
    },
  ];
};

export const WEEK_DAYS = [
  { label: "weekday.monday", value: 1 },
  { label: "weekday.tuesday", value: 2 },
  { label: "weekday.wednesday", value: 3 },
  { label: "weekday.thursday", value: 4 },
  { label: "weekday.friday", value: 5 },
  { label: "weekday.saturday", value: 6 },
  { label: "weekday.sunday", value: 7 },
];
