import NavbarLink from "./NavbarLink";
import {
  faCalendar,
  faComputerMouse,
  faFile,
  faHardDrive,
  faInfoCircle,
  faNetworkWired,
  faShield,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

type Props = {};

const DeviceNavbar = (props: Props) => {
  return (
    <div className="w-full flex bg-[#FFFFFF] shadow-xl rounded-[10px] p-2">
      <NavbarLink
        to="systeminfo"
        label="System Info"
        icon={faInfoCircle}
        alignment="vertical"
      />
      <NavbarLink
        to="hardware"
        label="Hardware"
        icon={faHardDrive}
        alignment="vertical"
      />
      <NavbarLink
        to="software"
        label="Software"
        icon={faFile}
        alignment="vertical"
      />
      <NavbarLink
        to="network"
        label="Network"
        icon={faNetworkWired}
        alignment="vertical"
      />
      <NavbarLink
        to="security"
        label="Security"
        icon={faShield}
        alignment="vertical"
      />
      <NavbarLink
        to="events"
        label="Events"
        icon={faCalendar}
        alignment="vertical"
      />
      <NavbarLink to="users" label="Users" icon={faUser} alignment="vertical" />
      <NavbarLink
        to="peripherals"
        label="Peripherals"
        icon={faComputerMouse}
        alignment="vertical"
      />
    </div>
  );
};

export default DeviceNavbar;
