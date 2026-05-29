import { useTranslation } from "react-i18next";
import { faHardDrive } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";

type MappedDrive = {
  DriveLetter: string;
  RemotePath: string;
  FileSystem: string | null;
  SizeGB: number | null;
  FreeGB: number | null;
};

type Props = { drives: MappedDrive[] };

const MappedDrives = ({ drives }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("device.section.mappedDrives")} icon={faHardDrive} />
      {!drives || drives.length === 0 ? (
        <div className="mt-3 text-[14px] text-[#9a9a9a]">
          {t("device.network.noMappedDrives")}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-[#F0F0F0]">
          {drives.map((d, i) => {
            const usedPct =
              d.SizeGB && d.FreeGB != null
                ? Math.round(((d.SizeGB - d.FreeGB) / d.SizeGB) * 100)
                : null;
            return (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-[40px] text-center font-extrabold text-[18px] text-[#2B9AE9]">
                  {d.DriveLetter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] text-[#3C3C3C] truncate">
                    {d.RemotePath}
                  </div>
                  {d.FileSystem && (
                    <div className="text-[12px] text-[#9a9a9a]">{d.FileSystem}</div>
                  )}
                </div>
                {d.SizeGB != null && d.FreeGB != null && (
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold text-[#3C3C3C]">
                      {d.FreeGB} GB {t("device.network.free")}
                    </div>
                    <div className="text-[11px] text-[#9a9a9a]">
                      {t("device.network.of")} {d.SizeGB} GB
                    </div>
                    {usedPct !== null && (
                      <div className="mt-1 w-[80px] h-[4px] rounded-full bg-[#F0F0F0]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${usedPct}%`,
                            backgroundColor:
                              usedPct > 90
                                ? "#F3606E"
                                : usedPct > 70
                                  ? "#F1C40F"
                                  : "#30A712",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MappedDrives;
