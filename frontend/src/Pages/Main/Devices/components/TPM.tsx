import { useTranslation } from "react-i18next";
import Parameter from "../../../../Components/Lists/Parameter";
import StatusPill from "../../../../Components/Badges/StatusPill";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = {
  SpecVersion: any;
  ManufacturerIDTxt: any;
  ManufacturerVersion: any;
  IsOwned_InitialValue: any;
  IsEnabled_InitialValue: any;
  IsActivated_InitialValue: any;
};

const TPM = ({
  SpecVersion,
  ManufacturerIDTxt,
  ManufacturerVersion,
  IsOwned_InitialValue,
  IsEnabled_InitialValue,
  IsActivated_InitialValue,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.tpm")} icon={faHandshake} />
      <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
        <StatusPill tone={IsActivated_InitialValue ? "green" : "red"} text={IsActivated_InitialValue ? "Active" : "Inactive"} />
        <StatusPill tone={IsEnabled_InitialValue ? "green" : "red"} text={IsEnabled_InitialValue ? "Enabled" : "Disabled"} />
        <StatusPill tone={IsOwned_InitialValue ? "green" : "gray"} text={IsOwned_InitialValue ? "Owned" : "Disowned"} />
      </div>
      <div className="divide-y divide-[#F0F0F0]">
        <Parameter name="Spec Version" value={SpecVersion} />
        <Parameter
          name="Manufacturer"
          value={`${ManufacturerIDTxt} - ${ManufacturerVersion}`}
        />
      </div>
    </div>
  );
};

export default TPM;
