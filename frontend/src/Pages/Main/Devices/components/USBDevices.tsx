import React from "react";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faUsb } from "@fortawesome/free-brands-svg-icons";

type Props = { usbDevices: any };

const USBDevices = ({ usbDevices }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="USB Devices" icon={faUsb} />
      {usbDevices.map((usb: any) => (
        <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
          {usb}
        </div>
      ))}
    </div>
  );
};

export default USBDevices;
