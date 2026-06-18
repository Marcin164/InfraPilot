import { useTranslation } from "react-i18next";
import Partitions from "./Partitions";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

type Props = { disks: any };

const Disks = ({ disks }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.disks")} icon={faFloppyDisk} />
      {(disks ?? []).map((disk: any, index: number) => (
        <div
          key={index}
          className="mt-2 pt-2 first:mt-0 first:pt-0 border-t border-[#F0F0F0] first:border-t-0"
        >
          <div className="text-[16px] font-semibold text-[#2B9AE9]">
            {disk.model}
          </div>
          <div className="text-[13px] font-light text-[#9a9a9a]">
            {disk.serial_number}
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            {(disk.partitions ?? []).map((partition: any, pIndex: number) => (
              <Partitions key={pIndex} {...partition} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Disks;
