import { motion } from "framer-motion";
import { useLogoutFunction } from "@propelauth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOut,
  faUser,
  faTicket,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import NavbarLink from "../../../Components/Navbar/NavbarLink";
import Logo from "../../../assets/Logo.png";

const items = [
  { to: "/user/account", label: "nav.user", icon: faUser },
  { to: "/user/tickets", label: "nav.tickets", icon: faTicket },
  { to: "/user/settings", label: "nav.settings", icon: faGear },
];

const navItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
};

const UserNavbar = () => {
  const logout = useLogoutFunction();
  const { t } = useTranslation();

  return (
    <div className="w-[240px] h-screen bg-[#FFFFFF] px-2 flex flex-col justify-between">
      <div>
        <motion.img
          src={Logo}
          className="p-2 rounded"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.04, delayChildren: 0.1 }}
        >
          {items.map((item) => (
            <motion.div
              key={item.to}
              variants={navItem}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <NavbarLink
                to={item.to}
                label={t(item.label)}
                icon={item.icon}
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
          <span className="pl-4">Logout</span>
        </button>
      </motion.div>
    </div>
  );
};

export default UserNavbar;
