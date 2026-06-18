import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faUsb } from "@fortawesome/free-brands-svg-icons";

type Props = { usbDevices: any };

const USBDevices = ({ usbDevices }: Props) => {
  const { t } = useTranslation();
  const list = usbDevices ?? [];
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text={t("device.section.usbDevices")} icon={faUsb} />
      {list.length === 0 ? (
        <div className="mt-3 text-[13px] text-[#9a9a9a]">Brak urządzeń USB.</div>
      ) : (
        <div className="mt-2 divide-y divide-[#F0F0F0]">
          {list.map((usb: any, index: number) => (
            <div key={index} className="py-1.5 text-[14px] font-semibold text-[#3C3C3C]">
              {usb}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default USBDevices;
