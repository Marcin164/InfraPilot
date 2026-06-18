import { faFire } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import StatusPill, { StatusTone } from "../../../../Components/Badges/StatusPill";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { firewall: any };

const Firewall = ({ firewall }: Props) => {
  const { t } = useTranslation();
  const toneFor = (value: any): StatusTone => {
    switch (value) {
      case 0:
        return "red";
      case 1:
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.firewall")} icon={faFire} />
      {(firewall ?? []).map((fw: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[#3C3C3C] font-semibold mb-1.5">{fw.Name}</div>
          <div className="flex flex-wrap gap-1.5">
            <StatusPill text={t("device.section.firewallEnabled")} tone={toneFor(fw.Enabled)} />
            <StatusPill text={t("device.section.userApps")} tone={toneFor(fw.AllowUserApps)} />
            <StatusPill text={t("device.section.userPorts")} tone={toneFor(fw.AllowUserPorts)} />
            <StatusPill text={t("device.section.inboundRules")} tone={toneFor(fw.AllowInboundRules)} />
            <StatusPill text={t("device.section.defaultInbound")} tone={toneFor(fw.DefaultInboundAction)} />
            <StatusPill text={t("device.section.defaultOutbound")} tone={toneFor(fw.DefaultOutboundAction)} />
            <StatusPill text={t("device.section.localFirewallRules")} tone={toneFor(fw.AllowLocalFirewallRules)} />
            <StatusPill text={t("device.section.stealthMode")} tone={toneFor(fw.EnableStealthModeForIPSec)} />
            <StatusPill text={t("device.section.uniMulti")} tone={toneFor(fw.AllowUnicastResponseToMulticast)} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Firewall;
