export const groupTypeOptions = [
  {
    value: "Computers",
    label: "Computers",
  },
  {
    value: "Peripherals",
    label: "Peripherals",
  },
  {
    value: "Network",
    label: "Network",
  },
  {
    value: "Components",
    label: "Components",
  },
  {
    value: "Other",
    label: "Other",
  },
];

export const computersTypeOptions = [
  { value: "Laptop", label: "Laptop" },
  { value: "PC", label: "PC" },
  { value: "Thinclient", label: "Thinclient" },
];

export const peripheralsTypeOptions = [
  { value: "Screen", label: "Screen" },
  { value: "Mouse", label: "Mouse" },
  { value: "Keyboard", label: "Keyboard" },
  { value: "Headset", label: "Headset" },
  { value: "Microphone", label: "Microphone" },
  { value: "Speaker", label: "Speaker" },
  { value: "Camera", label: "Camera" },
  { value: "Printer", label: "Printer" },
  { value: "Scanner", label: "Scanner" },
  { value: "Multifunction device", label: "Multifunction device" },
];

export const networkTypeOptions = [
  { value: "Switch", label: "Switch" },
  { value: "Router", label: "Router" },
  { value: "AP", label: "AP" },
  { value: "Firewall", label: "Firewall" },
  { value: "Deskphone", label: "Deskphone" },
];

export const componentsTypeOptions = [
  { value: "RAM", label: "RAM" },
  { value: "CPU", label: "CPU" },
  { value: "Graphic Card", label: "Graphic Card" },
  { value: "MOBO", label: "MOBO" },
  { value: "FAN", label: "FAN" },
  { value: "Network Card", label: "Network Card" },
  { value: "Storage", label: "Storage" },
  { value: "PSU", label: "PSU" },
  { value: "UPS", label: "UPS" },
];

export const othersTypeOptions = [
  { value: "Phone", label: "Phone" },
  { value: "Cable", label: "Cable" },
  { value: "Other", label: "Other" },
];

export const historyTypeOptions = [
  {
    label: "Repair",
    value: 1,
  },
  {
    label: "Rebuild",
    value: 2,
  },
  {
    label: "Component replacement",
    value: 3,
  },
  {
    label: "Other",
    value: 4,
  },
];

export const groupMappings: { group: string; subgroupOptions: any }[] = [
  { group: "Computers", subgroupOptions: computersTypeOptions },
  { group: "Peripherals", subgroupOptions: peripheralsTypeOptions },
  { group: "Network", subgroupOptions: networkTypeOptions },
  { group: "Components", subgroupOptions: componentsTypeOptions },
  { group: "Other", subgroupOptions: othersTypeOptions },
];

export const ticketStateOptions = [
  { label: "New", value: "New" },
  { label: "Assigned", value: "Assigned" },
  { label: "In progress", value: "In progress" },
  { label: "Awaiting for user", value: "Awaiting for user" },
  { label: "Awaiting for vendor", value: "Awaiting for vendor" },
  { label: "Resolved", value: "Resolved" },
  { label: "Closed", value: "Closed" },
  { label: "Cancelled", value: "Cancelled" },
];

export const ticketPriorityOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
  { label: "Critical", value: "Critical" },
];

export const ticketImpactOptions = [
  { label: "Single user", value: "Single user" },
  { label: "Multiple users", value: "Multiple users" },
  { label: "Whole company", value: "Whole company" },
];

export const ticketUrgencyOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

export const closureCodesOptions = [
  { label: "Solved permanently", value: "Solved Permanently" },
  { label: "Solved temporarily", value: "Solved temporarily" },
  { label: "Not actioned", value: "Not actioned" },
  { label: "No reply", value: "No reply" },
  { label: "Workaround", value: "Workaround" },
];
