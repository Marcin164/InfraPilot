import { useTranslation } from "react-i18next";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Share = {
  Name: string;
  Path: string;
  Description: string | null;
  CurrentUsers: number;
};

type Props = { shares: Share[] };

const Shares = ({ shares }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("device.section.shares")} icon={faFolderOpen} />
      {!shares || shares.length === 0 ? (
        <div className="mt-3 text-[14px] text-[#9a9a9a]">
          {t("device.network.noShares")}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-[#F0F0F0]">
          {shares.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <div className="font-bold text-[14px] text-[#3C3C3C]">
                  {s.Name}
                </div>
                <div className="text-[12px] text-[#9a9a9a] font-mono truncate">
                  {s.Path}
                </div>
                {s.Description && (
                  <div className="text-[12px] text-[#535353]">{s.Description}</div>
                )}
              </div>
              {s.CurrentUsers > 0 && (
                <div className="flex items-center gap-1 shrink-0 text-[13px] text-[#2B9AE9] font-bold">
                  <FontAwesomeIcon icon={faUser} className="text-[11px]" />
                  {s.CurrentUsers}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shares;
