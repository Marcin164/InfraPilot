import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Antivirus from "../components/Antivirus";
import { useOutletContext } from "react-router";
import Bitlocker from "../components/Bitlocker";
import Firewall from "../components/Firewall";
import RDP from "../components/RDP";
import TPM from "../components/TPM";
import NoData from "../components/NoData";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faCircleCheck, faCircleXmark, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";

const COMPLIANCE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  compliant:    { label: "Zgodny",         color: "text-green-600 bg-green-50 border-green-200", icon: faCircleCheck },
  noncompliant: { label: "Niezgodny",      color: "text-red-600 bg-red-50 border-red-200",       icon: faCircleXmark },
  inGracePeriod:{ label: "Okres próbny",   color: "text-amber-600 bg-amber-50 border-amber-200", icon: faCircleQuestion },
  configManager:{ label: "ConfigMgr",      color: "text-blue-600 bg-blue-50 border-blue-200",    icon: faCircleCheck },
  unknown:      { label: "Nieznany",       color: "text-gray-500 bg-gray-50 border-gray-200",    icon: faCircleQuestion },
};

const IntuneCompliance = ({ device }: { device: any }) => {
  if (!device.intuneDeviceId && !device.intuneComplianceState) return null;

  const state = device.intuneComplianceState ?? "unknown";
  const cfg = COMPLIANCE_CONFIG[state] ?? COMPLIANCE_CONFIG.unknown;

  return (
    <div className="bg-white rounded-[10px] shadow p-4 border border-[#E0E0E0]">
      <div className="flex items-center gap-2 mb-3">
        <FontAwesomeIcon icon={faShieldHalved} className="text-[#3C3C3C]" />
        <span className="font-semibold text-[14px] text-[#3C3C3C]">Microsoft Intune</span>
      </div>
      <div className="space-y-2 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-[#7a7a7a]">Status compliance</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium text-[12px] ${cfg.color}`}>
            <FontAwesomeIcon icon={cfg.icon} />
            {cfg.label}
          </span>
        </div>
        {device.intuneLastSyncAt && (
          <div className="flex items-center justify-between">
            <span className="text-[#7a7a7a]">Ostatni check-in</span>
            <span className="text-[#3C3C3C]">{moment(device.intuneLastSyncAt).format("DD.MM.YYYY HH:mm")}</span>
          </div>
        )}
        {device.intuneDeviceId && (
          <div className="flex items-center justify-between">
            <span className="text-[#7a7a7a]">Intune Device ID</span>
            <span className="text-[#9a9a9a] font-mono text-[11px] truncate max-w-[160px]" title={device.intuneDeviceId}>{device.intuneDeviceId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Security = () => {
  const device: any = useOutletContext();
  const hasSecurityData = !!device?.data?.security;
  const hasIntuneData = !!device?.data?.intuneDeviceId || !!device?.data?.intuneComplianceState;

  if (!hasSecurityData && !hasIntuneData) return <NoData />;

  const securityInfo = device.data?.security ?? {};

  return (
    <div className="w-full cursor-default overflow-x-hidden">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          {hasIntuneData && <IntuneCompliance device={device.data} />}
          {hasSecurityData && <Antivirus avs={securityInfo.antivirus} />}
          {hasSecurityData && <Bitlocker bitlocker={securityInfo.bitlocker} />}
          {hasSecurityData && <Firewall firewall={securityInfo.firewall_profile} />}
          {hasSecurityData && <RDP rdp={securityInfo.rdp_status} />}
          {hasSecurityData && <TPM {...securityInfo.tpm} />}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Security;
