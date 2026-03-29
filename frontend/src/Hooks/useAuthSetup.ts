import { useEffect } from "react";
import { useAuthInfo } from "@propelauth/react";
import { setAuthToken } from "../lib/api";

export const useAuthSetup = () => {
  const { accessToken } = useAuthInfo();

  useEffect(() => {
    setAuthToken(accessToken ?? null);
  }, [accessToken]);
};
