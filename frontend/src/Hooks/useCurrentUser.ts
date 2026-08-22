import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "../Services/users";

// Same query key everywhere ("current-user", <id>) so every caller shares
// one cache entry instead of re-fetching the logged-in user's role flags
// per component.
export const useCurrentUser = () => {
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  return useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });
};
