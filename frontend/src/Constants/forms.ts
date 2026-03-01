import Input from "../Components/Inputs/Input";
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
      label: "User",
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
      label: "Device",
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
      label: "Ticket",
      Component: Input,
    },
    {
      name: "justification",
      label: "Justification",
      Component: Input,
    },
    {
      name: "details",
      label: "Details",
      Component: Input,
    },
    {
      name: "approvers",
      label: "Approvers",
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
      label: "Date",
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
      label: "Group",
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
      label: "Subgroup",
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
      label: "Asset Name",
      Component: Input,
    },
    {
      name: "model",
      label: "Model",
      required: true,
      Component: Input,
    },
    {
      name: "manufacturer",
      label: "Manufacturer",
      required: true,
      Component: Input,
    },
    {
      name: "serialNumber",
      label: "Serial Number",
      required: true,
      Component: Input,
    },
    {
      name: "location",
      label: "Location",
      Component: Input,
    },
  ];
};

export const WEEK_DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];
