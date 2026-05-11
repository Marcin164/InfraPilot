import { faFire } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Badge from "../../../../Components/Badges/Badge";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { firewall: any };

const Firewall = ({ firewall }: Props) => {
  const { t } = useTranslation();
  const setConfigurationStateColor = (value: any) => {
    let configurationStateColor = "bg-[#3C3C3C]";
    switch (value) {
      case 0:
        configurationStateColor = "bg-[#F3606A]";
        break;

      case 1:
        configurationStateColor = "bg-[#30A712]";
        break;

      case 2:
        configurationStateColor = "bg-[#3C3C3C]";
        break;
    }

    return configurationStateColor;
  };

  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.firewall")} icon={faFire} />
      {firewall.map((fw: any) => (
        <div className="pt-2 pb-1">
          <div className="text-[#3C3C3C] font-semibold">{fw.Name}</div>
          <div className="flex flex-wrap">
            <Badge
              text={t("device.section.firewallEnabled")}
              className={setConfigurationStateColor(fw.Enabled)}
            />
            <Badge
              text={t("device.section.userApps")}
              className={setConfigurationStateColor(fw.AllowUserApps)}
            />
            <Badge
              text={t("device.section.userPorts")}
              className={setConfigurationStateColor(fw.AllowUserPorts)}
            />
            <Badge
              text={t("device.section.inboundRules")}
              className={setConfigurationStateColor(fw.AllowInboundRules)}
            />
            <Badge
              text={t("device.section.defaultInbound")}
              className={setConfigurationStateColor(fw.DefaultInboundAction)}
            />
            <Badge
              text={t("device.section.defaultOutbound")}
              className={setConfigurationStateColor(fw.DefaultOutboundAction)}
            />
            <Badge
              text={t("device.section.localFirewallRules")}
              className={setConfigurationStateColor(fw.AllowLocalFirewallRules)}
            />
            <Badge
              text={t("device.section.stealthMode")}
              className={setConfigurationStateColor(
                fw.EnableStealthModeForIPSec,
              )}
            />
            <Badge
              text={t("device.section.uniMulti")}
              className={setConfigurationStateColor(
                fw.AllowUnicastResponseToMulticast,
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Firewall;
