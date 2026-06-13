import { useAuthInfo } from "@propelauth/react";
import { setAuthToken } from "../lib/api";

export const useAuthSetup = () => {
  const { accessToken } = useAuthInfo();
  setAuthToken(accessToken ?? null);
};
