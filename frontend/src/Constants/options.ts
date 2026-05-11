export const groupTypeOptions = [
  { value: "Computers", label: "options.group.computers" },
  { value: "Peripherals", label: "options.group.peripherals" },
  { value: "Network", label: "options.group.network" },
  { value: "Components", label: "options.group.components" },
  { value: "Other", label: "options.group.other" },
];

export const computersTypeOptions = [
  { value: "Laptop", label: "options.computer.laptop" },
  { value: "PC", label: "options.computer.pc" },
  { value: "Thinclient", label: "options.computer.thinclient" },
];

export const peripheralsTypeOptions = [
  { value: "Screen", label: "options.peripheral.screen" },
  { value: "Mouse", label: "options.peripheral.mouse" },
  { value: "Keyboard", label: "options.peripheral.keyboard" },
  { value: "Headset", label: "options.peripheral.headset" },
  { value: "Microphone", label: "options.peripheral.microphone" },
  { value: "Speaker", label: "options.peripheral.speaker" },
  { value: "Camera", label: "options.peripheral.camera" },
  { value: "Printer", label: "options.peripheral.printer" },
  { value: "Scanner", label: "options.peripheral.scanner" },
  { value: "Multifunction device", label: "options.peripheral.multifunction" },
];

export const networkTypeOptions = [
  { value: "Switch", label: "options.network.switch" },
  { value: "Router", label: "options.network.router" },
  { value: "AP", label: "options.network.ap" },
  { value: "Firewall", label: "options.network.firewall" },
  { value: "Deskphone", label: "options.network.deskphone" },
];

export const componentsTypeOptions = [
  { value: "RAM", label: "options.component.ram" },
  { value: "CPU", label: "options.component.cpu" },
  { value: "Graphic Card", label: "options.component.graphicCard" },
  { value: "MOBO", label: "options.component.mobo" },
  { value: "FAN", label: "options.component.fan" },
  { value: "Network Card", label: "options.component.networkCard" },
  { value: "Storage", label: "options.component.storage" },
  { value: "PSU", label: "options.component.psu" },
  { value: "UPS", label: "options.component.ups" },
];

export const othersTypeOptions = [
  { value: "Phone", label: "options.other.phone" },
  { value: "Cable", label: "options.other.cable" },
  { value: "Other", label: "options.other.other" },
];

export const historyTypeOptions = [
  { label: "options.history.repair", value: 1 },
  { label: "options.history.rebuild", value: 2 },
  { label: "options.history.componentReplacement", value: 3 },
  { label: "options.history.other", value: 4 },
];

export const groupMappings: { group: string; subgroupOptions: any }[] = [
  { group: "Computers", subgroupOptions: computersTypeOptions },
  { group: "Peripherals", subgroupOptions: peripheralsTypeOptions },
  { group: "Network", subgroupOptions: networkTypeOptions },
  { group: "Components", subgroupOptions: componentsTypeOptions },
  { group: "Other", subgroupOptions: othersTypeOptions },
];

export const ticketStateOptions = [
  { label: "options.ticket.state.new", value: "New" },
  { label: "options.ticket.state.assigned", value: "Assigned" },
  { label: "options.ticket.state.inProgress", value: "In progress" },
  { label: "options.ticket.state.awaitingForUser", value: "Awaiting for user" },
  { label: "options.ticket.state.awaitingForVendor", value: "Awaiting for vendor" },
  { label: "options.ticket.state.resolved", value: "Resolved" },
  { label: "options.ticket.state.closed", value: "Closed" },
  { label: "options.ticket.state.cancelled", value: "Cancelled" },
];

export const ticketPriorityOptions = [
  { label: "form.priority.low", value: "Low" },
  { label: "form.priority.medium", value: "Medium" },
  { label: "form.priority.high", value: "High" },
  { label: "form.priority.critical", value: "Critical" },
];

export const ticketImpactOptions = [
  { label: "options.ticket.impact.singleUser", value: "Single user" },
  { label: "options.ticket.impact.multipleUsers", value: "Multiple users" },
  { label: "options.ticket.impact.wholeCompany", value: "Whole company" },
];

export const ticketUrgencyOptions = [
  { label: "options.ticket.urgency.low", value: "Low" },
  { label: "options.ticket.urgency.medium", value: "Medium" },
  { label: "options.ticket.urgency.high", value: "High" },
];

export const closureCodesOptions = [
  { label: "options.closure.solvedPermanently", value: "Solved Permanently" },
  { label: "options.closure.solvedTemporarily", value: "Solved temporarily" },
  { label: "options.closure.notActioned", value: "Not actioned" },
  { label: "options.closure.noReply", value: "No reply" },
  { label: "options.closure.workaround", value: "Workaround" },
];
