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
  memberOf?: string[];
  distinguishedName: string;
  lastLogonDate?: string;
}

export type CreateUserData = Omit<User, "id" | "isApprover" | "isAdmin" | "enabled" | "distinguishedName">;

export interface UserFilter {
  [key: string]: string[] | undefined;
}
