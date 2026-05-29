import { today } from "../Helpers/date";
import { computersTypeOptions, groupTypeOptions } from "./options";

export const addUserDefaultValues = {
  name: "",
  surname: "",
  username: "",
  email: "",
  title: "",
  department: "",
  company: "",
  office: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};

export const addDeviceDefaultValues = {
  group: groupTypeOptions[0]?.value ?? "",
  subgroup: computersTypeOptions[0]?.value ?? "",
  assetName: "",
  serialNumber: "",
  model: "",
  manufacturer: "",
  location: "",
  locationId: "",
};

export const applyChangeDefaultValues = {
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
  addedComponents: [] as string[],
  agent: "",
  date: "",
  details: "",
  justification: "",
  type: 1,
};

export const assignDeviceDefaultValues = {
  userId: "",
  deviceId: "",
  ticket: "",
  details: "",
  justification: "",
  approvers: [] as string[],
  date: today,
};

export const updateTicketDefaultValues = (
  state: any,
  priority: any,
  impact: any,
  urgency: any,
) => {
  return {
    state: state,
    assignee: "",
    assignmentGroup: "",
    priority: priority,
    impact: impact,
    urgency: urgency,
  };
};
