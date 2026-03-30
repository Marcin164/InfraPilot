import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Antivirus from "../components/Antivirus";
import { useOutletContext } from "react-router";
import Bitlocker from "../components/Bitlocker";
import Firewall from "../components/Firewall";
import RDP from "../components/RDP";
import TPM from "../components/TPM";
import NoData from "../components/NoData";

type Props = {};

const Security = (props: Props) => {
  const device: any = useOutletContext();
  if (!device?.data?.security) return <NoData />;

  const securityInfo = device.data.security;

  return (
    <div className="w-full cursor-default overflow-x-hidden">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          <Antivirus avs={securityInfo.antivirus} />
          <Bitlocker bitlocker={securityInfo.bitlocker} />
          <Firewall firewall={securityInfo.firewall_profile} />
          <RDP rdp={securityInfo.rdp_status} />
          <TPM {...securityInfo.tpm} />
          {/* <StartupApps startupApps={securityInfo.startup_apps} /> */}
          {/* <UAC uac={securityInfo.uac_status} /> */}
          {/* <Updates updates={securityInfo.updates} /> */}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Security;
