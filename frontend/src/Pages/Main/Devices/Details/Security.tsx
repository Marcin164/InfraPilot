import React from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Antivirus from "../../../../Components/Details/Antivirus";
import { useOutletContext } from "react-router";
import Bitlocker from "../../../../Components/Details/Bitlocker";
import Firewall from "../../../../Components/Details/Firewall";
import PasswordPolicy from "../../../../Components/Details/PasswordPolicy";
import RDP from "../../../../Components/Details/RDP";
import StartupApps from "../../../../Components/Details/StartupApps";
import UAC from "../../../../Components/Details/UAC";
import Updates from "../../../../Components/Details/Updates";

type Props = {};

const Security = (props: Props) => {
  const device: any = useOutletContext();
  if (!device?.data?.security) return null;

  const securityInfo = device.data.security;

  return (
    <div className="w-full cursor-default overflow-x-hidden">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          <Antivirus avs={securityInfo.antivirus} />
          <Bitlocker bitlocker={securityInfo.bitlocker} />
          <Firewall firewall={securityInfo.firewall} />
          <PasswordPolicy passwordPolicy={securityInfo.password_policy} />
          <RDP rdp={securityInfo.rdp_status} />
          <StartupApps startupApps={securityInfo.startup_apps} />
          <UAC uac={securityInfo.uac_status} />
          <Updates updates={securityInfo.updates} />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Security;
