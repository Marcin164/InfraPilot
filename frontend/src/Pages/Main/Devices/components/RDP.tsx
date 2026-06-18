import { useTranslation } from "react-i18next";
import StatusPill from "../../../../Components/Badges/StatusPill";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faPlug } from "@fortawesome/free-solid-svg-icons";

type Props = { rdp: any };

const RDP = ({ rdp }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.rdp")} icon={faPlug} />
      <div className="mt-2">
        <StatusPill
          tone={rdp?.RDP_Enabled ? "amber" : "green"}
          text={rdp?.RDP_Enabled ? "Enabled" : "Disabled"}
        />
      </div>
    </div>
  );
};

export default RDP;
