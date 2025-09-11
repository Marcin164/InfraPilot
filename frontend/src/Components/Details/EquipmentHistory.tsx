import { faLaptop, faMouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {};

const EquipmentHistory = (props: Props) => {
  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] row-span-3 p-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">
        Equipment History
      </div>
      <div>
        <div className="border-l-[1px] border-[#2B9AE9] relative h-[400px]">
          <div className="w-[16px] h-[16px] bg-[#2B9AE9] rounded-[5px] absolute left-[-8px] top-[5px]"></div>
          <div className="ml-[20px]">
            <div className="">
              <span className="text-[#535353] font-bold">12 February 2025</span>
              <span className="text-[#2B9AE9] font-bold ml-2">
                Ticket SR00025348
              </span>
            </div>
            <div className="py-1 flex justify-between">
              <span>
                <FontAwesomeIcon
                  icon={faMouse}
                  className="pr-2 text-[#535353]"
                />
                <span className="text-[#535353]">
                  DELL MOUSE MS116, GHROC84
                </span>
              </span>
              <span className="bg-[#2B9AE9] px-2 py-1 text-[#FFFFFF] rounded-[10px] font-bold">
                Office
              </span>
            </div>
            <div>
              <div className="text-[#535353] font-bold">Justification</div>
              <span className="text-[#3C3C3C] font-light italic">
                Equipment needed for Linux Desktop Server
              </span>
            </div>
            <div>
              <div className="text-[#535353] font-bold">Approvers</div>
              <span className="text-[#3C3C3C] font-light italic">
                Marcin &bull; Jan
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentHistory;
