import {
  faPrint,
  faShare,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../../../../Components/Badges/Badge";
import Parameter from "../../../../Components/Lists/Parameter";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { printers: any };

const Printers = ({ printers }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Printers" icon={faPrint} />
      {printers.map((printer: any) => (
        <div>
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {printer.name}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2 overflow-hidden text-ellipsis">
            {printer.port}
          </div>
          <Parameter name="Device ID" value={printer.pnp_device_id} />
          <Parameter name="Driver" value={printer.driver} />
          <Parameter
            name="Offline mode"
            value={printer.work_offline ? "Yes" : "No"}
          />
          <div className="flex mt-2">
            {!printer.default && (
              <Badge text="Default" className="bg-[#30A712]" />
            )}
            <Badge
              icon={printer.shared ? faShare : faXmarkCircle}
              text={printer.shared ? "Shared" : "Not shared"}
              className={printer.shared ? "bg-[#30A712]" : "bg-[#3C3C3C]"}
            />
            <Badge text={printer.status} className="bg-[#2B9AE9]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Printers;
