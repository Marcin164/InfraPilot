import React from "react";

type Props = { usbDevices: any };

const USBDevices = ({ usbDevices }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#3C3C3C]">
        {/* <FontAwesomeIcon icon={faCableCar} /> */}
        <span>USB Devices</span>
      </div>
      {usbDevices.map((usb: any) => (
        <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
          {usb}
        </div>
      ))}
    </div>
  );
};

export default USBDevices;
