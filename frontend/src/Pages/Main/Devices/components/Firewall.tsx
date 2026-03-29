import Badge from "../../../../Components/Badges/Badge";

type Props = { firewall: any };

const Firewall = ({ firewall }: Props) => {
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
      <div className="text-[20px] font-semibold text-[#2B9AE9]">Firewall</div>
      {firewall.map((fw: any) => (
        <div className="pt-2 pb-1">
          <div className="text-[#3C3C3C] font-semibold">{fw.Name}</div>
          <div className="flex flex-wrap">
            <Badge
              text="Enabled"
              className={setConfigurationStateColor(fw.Enabled)}
            />
            <Badge
              text="User Apps"
              className={setConfigurationStateColor(fw.AllowUserApps)}
            />
            <Badge
              text="User Ports"
              className={setConfigurationStateColor(fw.AllowUserPorts)}
            />
            <Badge
              text="Inbound Rules"
              className={setConfigurationStateColor(fw.AllowInboundRules)}
            />
            <Badge
              text="Default Inbound Action"
              className={setConfigurationStateColor(fw.DefaultInboundAction)}
            />
            <Badge
              text="Default Outbound Action"
              className={setConfigurationStateColor(fw.DefaultOutboundAction)}
            />
            <Badge
              text="Local Firewall Rules"
              className={setConfigurationStateColor(fw.AllowLocalFirewallRules)}
            />
            <Badge
              text="Stealth Mode (IPsec)"
              className={setConfigurationStateColor(
                fw.EnableStealthModeForIPSec,
              )}
            />
            <Badge
              text="Uni-to-Multi Response"
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
