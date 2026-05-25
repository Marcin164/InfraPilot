import { useTranslation } from "react-i18next";
import NavbarLink from "./NavbarLink";
import { deviceNavbarItems } from "../../Constants/navigation";

const DeviceNavbar = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-nowrap bg-[#FFFFFF] shadow-xl rounded-[10px] p-2 overflow-x-auto scrollbar-nav">
      {deviceNavbarItems.map((navbarItem) => (
        <NavbarLink
          key={navbarItem.to}
          to={navbarItem.to}
          label={t(navbarItem.label)}
          icon={navbarItem.icon}
          alignment="vertical"
        />
      ))}
    </div>
  );
};

export default DeviceNavbar;
