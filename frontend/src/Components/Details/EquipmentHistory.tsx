import TimelineLine from "../Timeline/TimelineLine";

type Props = {};

const EquipmentHistory = (props: Props) => {
  const items = [
    {
      date: "08.10.2025",
      ticket: "SR6667777",
      devices: [
        {
          model: "DELL U2245E",
          serialNumber: "SN-SCREEN-004",
          location: "Office",
        },
      ],
      details: "lorem ipsum",
      justification: "Equipment for work",
      approvers: ["Jan Kowalski", "Nicoll Vostal"],
    },
    {
      date: "08.10.2025",
      ticket: "SR6667777",
      devices: [
        {
          model: "DELL U2245E",
          serialNumber: "SN-SCREEN-004",
          location: "Office",
        },
      ],
      details: "lorem ipsum",
      justification: "Equipment for work",
      approvers: ["Jan Kowalski", "Nicoll Vostal"],
    },
  ];
  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] row-span-3 p-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">
        Equipment History
      </div>
      <div>
        <TimelineLine items={items} />
      </div>
    </div>
  );
};

export default EquipmentHistory;
