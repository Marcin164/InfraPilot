import Parameter from "../../../../Components/Lists/Parameter";

type Props = {
  IPv6Address: string;
  IPv6Gateway: string;
  IPv6LinkLocal: string;
};

const IPv6 = ({ IPv6Address, IPv6Gateway, IPv6LinkLocal }: Props) => {
  if (!IPv6Address) return null;
  return (
    <div className="divide-y divide-[#F0F0F0]">
      <Parameter name="Address" value={IPv6Address} />
      {IPv6Gateway && <Parameter name="Gateway" value={IPv6Gateway} />}
      <Parameter name="Link-Local" value={IPv6LinkLocal} />
    </div>
  );
};

export default IPv6;
