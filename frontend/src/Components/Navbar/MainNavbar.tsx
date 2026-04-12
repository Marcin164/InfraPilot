import React from "react";
import NavbarLink from "./NavbarLink";
import { navbarItems, type NavbarItem } from "../../Constants/navigation";
import { useAuthInfo, useLogoutFunction } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import Logo from "../../assets/Logo.png";
import { useTranslation } from "react-i18next";
import { getUser } from "../../Services/users";

type Props = {};

const canSeeItem = (
  item: NavbarItem,
  user: { isAdmin?: boolean; isApprover?: boolean } | undefined,
) => {
  if (!item.requires) return true;
  if (!user) return false;
  if (item.requires === "admin") return Boolean(user.isAdmin);
  if (item.requires === "approverOrAdmin")
    return Boolean(user.isAdmin || user.isApprover);
  return true;
};

const MainNavbar = (props: Props) => {
  const logout = useLogoutFunction();
  const { t } = useTranslation();
  const authInfo: any = useAuthInfo();
  const accessToken = authInfo?.accessToken;
  const currentUserId = authInfo?.user?.metadata?.id;

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const visibleItems = navbarItems.filter((item) =>
    canSeeItem(item, currentUserQuery.data),
  );

  return (
    <div className="w-[240px] h-screen bg-[#FFFFFF] px-2 flex flex-col justify-between">
      <div>
        <img
          src={Logo}
          className="p-2 rounded"
          onClick={() => navigator.clipboard.writeText(accessToken)}
        />
        {visibleItems.map((navbarItem) => (
          <NavbarLink
            key={navbarItem.to}
            to={navbarItem.to}
            label={t(navbarItem.label)}
            icon={navbarItem.icon}
          />
        ))}
      </div>
      <div>
        <button
          className="text-[#535353] text-[16px] px-2 py-4 block cursor-pointer"
          onClick={() => logout(false)}
        >
          <FontAwesomeIcon icon={faSignOut} />
          <span className="pl-4">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default MainNavbar;
