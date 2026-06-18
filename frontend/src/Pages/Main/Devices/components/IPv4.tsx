import Parameter from "../../../../Components/Lists/Parameter";

type Props = {
  IPv4Address: string;
  NetMask: string;
  IPv4Gateway: string;
};

const IPv4 = ({ IPv4Address, NetMask, IPv4Gateway }: Props) => {
  return (
    <div className="divide-y divide-[#F0F0F0]">
      <Parameter name="Address" value={IPv4Address ? `${IPv4Address} / ${NetMask}` : undefined} />
      {IPv4Gateway && <Parameter name="Gateway" value={IPv4Gateway} />}
    </div>
  );
};

export default IPv4;
