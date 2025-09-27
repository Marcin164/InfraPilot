import NavbarLink from "./NavbarLink";
import { deviceNavbarItems } from "../../Constants/navigation";

const DeviceNavbar = () => {
  return (
    <div className="w-full flex bg-[#FFFFFF] shadow-xl rounded-[10px] p-2">
      {deviceNavbarItems.map((navbarItem) => (
        <NavbarLink
          to={navbarItem.to}
          label={navbarItem.label}
          icon={navbarItem.icon}
          alignment="vertical"
        />
      ))}
    </div>
  );
};

export default DeviceNavbar;
