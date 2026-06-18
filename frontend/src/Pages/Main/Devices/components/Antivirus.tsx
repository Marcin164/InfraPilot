import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faVirusSlash } from "@fortawesome/free-solid-svg-icons";

type Props = { avs: any };

const Antivirus = ({ avs }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.av")} icon={faVirusSlash} />
      {(avs ?? []).map((av: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[#3C3C3C] text-[15px] font-semibold">{av.displayName}</div>
          <div className="text-[#9a9a9a] text-[12px] font-light truncate">
            {av.pathToSignedProductExe}
          </div>
        </div>
      ))}
      {(avs ?? []).length === 0 && (
        <div className="mt-3 text-[13px] text-[#9a9a9a]">Brak danych o antywirusie.</div>
      )}
    </div>
  );
};

export default Antivirus;
