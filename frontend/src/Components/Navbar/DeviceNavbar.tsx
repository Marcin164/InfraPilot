import { useTranslation } from "react-i18next";
import NavbarLink from "./NavbarLink";
import { deviceNavbarItems } from "../../Constants/navigation";

type Props = { group?: string | null };

const DeviceNavbar = ({ group }: Props) => {
  const { t } = useTranslation();
  const isComputer = group === "Computers";
  const isNetwork = group === "Network";
  const items = deviceNavbarItems.filter((item) => {
    if (item.scope === "all") return true;
    if (item.scope === "computers") return isComputer;
    if (item.scope === "computersOrNetwork") return isComputer || isNetwork;
    if (item.scope === "network") return isNetwork;
    return !isComputer; // "other"
  });
  return (
    <div className="w-full flex flex-nowrap bg-[#FFFFFF] shadow-xl rounded-[10px] p-2 overflow-x-auto scrollbar-nav">
      {items.map((navbarItem) => (
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
