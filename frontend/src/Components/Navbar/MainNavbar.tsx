import { motion } from "framer-motion";
import NavbarLink from "./NavbarLink";
import { navbarItems, canSeeItem } from "../../Constants/navigation";
import { useAuthInfo, useLogoutFunction } from "@propelauth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut, faTimes } from "@fortawesome/free-solid-svg-icons";
import Logo from "../../assets/Logo.png";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "../../Hooks/useCurrentUser";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const navItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
};

const MainNavbar = ({ isOpen, onClose }: Props) => {
  const logout = useLogoutFunction();
  const { t } = useTranslation();
  const authInfo: any = useAuthInfo();
  const accessToken = authInfo?.accessToken;

  const currentUserQuery = useCurrentUser();

  const adminItems = navbarItems.filter((item) =>
    canSeeItem(item, currentUserQuery.data),
  );

  return (
    <div
      className={[
        "fixed left-0 top-0 h-screen w-[240px] z-40",
        "bg-[#FFFFFF] px-2 flex flex-col justify-between",
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      <div className="overflow-y-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <motion.img
            src={Logo}
            className="p-2 rounded flex-1"
            onClick={() => navigator.clipboard.writeText(accessToken)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <button
            className="lg:hidden text-[#535353] p-2 mr-1 flex-shrink-0"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.04, delayChildren: 0.1 }}
        >
          {adminItems.map((navbarItem) => (
            <motion.div key={navbarItem.to} variants={navItem} transition={{ duration: 0.2, ease: "easeOut" }}>
              <NavbarLink
                to={navbarItem.to}
                label={t(navbarItem.label)}
                icon={navbarItem.icon}
                onNavigate={onClose}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <button
          className="text-[#535353] text-[16px] px-2 py-4 block cursor-pointer"
          onClick={() => logout(false)}
        >
          <FontAwesomeIcon icon={faSignOut} />
          <span className="pl-4">{t("nav.logout")}</span>
        </button>
      </motion.div>
    </div>
  );
};

export default MainNavbar;
