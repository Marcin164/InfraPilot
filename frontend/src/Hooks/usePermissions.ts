import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { getUserPermissions } from "../Services/users";

// Same query key everywhere ("current-user-permissions", <id>) so every
// caller shares one cache entry instead of re-fetching the logged-in user's
// effective permission set per component. Mirrors useCurrentUser.ts.
export const usePermissions = () => {
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  return useQuery({
    queryKey: ["current-user-permissions", currentUserId],
    queryFn: () => getUserPermissions(currentUserId),
    enabled: Boolean(currentUserId),
  });
};
