import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Mice from "../components/Mice";
import { useOutletContext } from "react-router";
import Keyboards from "../components/Keyboards";
import Monitors from "../components/Monitors";
import SoundDevices from "../components/SoundDevices";
import Printers from "../components/Printers";
import USBDevices from "../components/USBDevices";
import ExternalDrives from "../components/ExternalDrives";
import NoData from "../components/NoData";

type Props = {};

const Peripherals = (props: Props) => {
  const device: any = useOutletContext();

  if (!device?.data?.peripherals) return <NoData />;

  const peripheralsInfo = device?.data?.peripherals;

  return (
    <div className="w-full cursor-default overflow-x-hidden">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          <Mice mice={peripheralsInfo.mice} />
          <Keyboards keyboards={peripheralsInfo.keyboards} />
          <Monitors screens={peripheralsInfo.monitors} />
          <SoundDevices soundDevices={peripheralsInfo.sound_devices} />
          <Printers printers={peripheralsInfo.printers} />
          <USBDevices usbDevices={peripheralsInfo.usb_devices} />
          <ExternalDrives drives={peripheralsInfo.external_drives} />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Peripherals;
