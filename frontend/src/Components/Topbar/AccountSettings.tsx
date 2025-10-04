import { faGear, faSignOut, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuthInfo, useLogoutFunction } from "@propelauth/react";
import React from "react";
import { NavLink } from "react-router";

type Props = { isOpen: boolean; closeModal: any };

const AccountSettings = ({ isOpen, closeModal }: Props) => {
  const authInfo: any = useAuthInfo();
  const logout = useLogoutFunction();
  const user = authInfo.user;

  if (!isOpen) return null;

  return (
    <div className="absolute p-1 w-[400px] bg-[#FFFFFF] border-1 border-[#E6E6E6] rounded-[10px] top-[40px] left-[-360px] z-[20] shadow-xl">
      <div className="bg-[#F6F6F6] px-2 py-2 rounded flex">
        <img className="w-[50px] h-[50px]" src="" />
        <div className="pl-4">
          <div className="font-bold text-[#24px]">{`${user.metadata.name} ${user.metadata.surname}`}</div>
          <div className="text-[#535353] font-light">{user.email}</div>
        </div>
      </div>
      <div>
        <div>
          <NavLink
            onClick={closeModal}
            className="text-[#535353] text-[16px] px-4 py-2 block hover:text-[#2B9AE9] hoverbg-[#D7EEFF]/50"
            to="https://3187297.propelauthtest.com/account/settings"
          >
            <div className="my-2">
              <FontAwesomeIcon icon={faUser} />
              <span className="pl-4">Account</span>
            </div>
          </NavLink>
          <NavLink
            onClick={closeModal}
            className="text-[#535353] text-[16px] px-4 py-1 block hover:text-[#2B9AE9] hoverbg-[#D7EEFF]/50"
            to="settings"
          >
            <div className="my-2">
              <FontAwesomeIcon icon={faGear} />
              <span className="pl-4">User settings</span>
            </div>
          </NavLink>
          <button
            className="text-[#535353] text-[16px] px-4 py-1 block hover:text-[#2B9AE9] hoverbg-[#D7EEFF]/50"
            onClick={() => logout(false)}
          >
            <div className="my-2">
              <FontAwesomeIcon icon={faSignOut} />
              <span className="pl-4">Logout</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
