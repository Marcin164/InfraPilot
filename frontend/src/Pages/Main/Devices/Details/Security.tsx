import React from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Antivirus from "../../../../Components/Details/Antivirus";
import { useOutletContext } from "react-router";
import Bitlocker from "../../../../Components/Details/Bitlocker";
import Firewall from "../../../../Components/Details/Firewall";
import PasswordPolicy from "../../../../Components/Details/PasswordPolicy";
import RDP from "../../../../Components/Details/RDP";

type Props = {};

const Security = (props: Props) => {
  const device: any = useOutletContext();
  if (!device?.data?.scanInfo) return null;

  const securityInfo = device.data.scanInfo.security_info;

  return (
    <div className="w-full cursor-default overflow-x-hidden">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          <Antivirus avs={securityInfo.antivirus} />
          <Bitlocker bitlocker={securityInfo.bitlocker} />
          <Firewall firewall={securityInfo.firewall} />
          <PasswordPolicy passwordPolicy={securityInfo.password_policy} />
          <RDP rdp={securityInfo.rdp_status} />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Security;
