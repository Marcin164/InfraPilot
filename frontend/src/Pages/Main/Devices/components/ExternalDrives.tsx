import { faHardDrive } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { drives: any };

const ExternalDrives = ({ drives }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader icon={faHardDrive} text={t("device.section.externalDrives")} />
      {(drives ?? []).map((drive: any, index: number) => {
        const usedPct = drive.Size > 0 ? Math.round(((drive.Size - drive.FreeSpace) / drive.Size) * 100) : 0;
        const barColor = usedPct > 90 ? "#F3606E" : usedPct > 70 ? "#F1C40F" : "#30A712";
        return (
          <div
            key={index}
            className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold text-[#2B9AE9] truncate">
                {`${drive.DeviceID} ${drive.VolumeName}`.trim()}
                {drive.FileSystem && (
                  <span className="text-[#9a9a9a] font-light text-[13px]"> ({drive.FileSystem})</span>
                )}
              </span>
              <span className="text-[12px] text-[#9a9a9a] shrink-0">{usedPct}%</span>
            </div>
            <div className="mt-1 h-[6px] rounded-full bg-[#F0F0F0] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${usedPct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExternalDrives;
