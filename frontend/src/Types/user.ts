export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  title: string;
  department: string;
  company: string;
  office: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  manager?: string;
  enabled?: boolean;
  isApprover: boolean;
  isAdmin: boolean;
  isAuditor?: boolean;
  isCompliance?: boolean;
  isHelpdesk?: boolean;
  isDpo?: boolean;
  memberOf?: string[];
  distinguishedName: string;
  lastLogonDate?: string;
}

export type CreateUserData = Omit<
  User,
  | "id"
  | "isApprover"
  | "isAdmin"
  | "isAuditor"
  | "isCompliance"
  | "isHelpdesk"
  | "isDpo"
  | "enabled"
  | "distinguishedName"
>;

export interface UserFilter {
  [key: string]: string[] | undefined;
}
