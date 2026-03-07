type Props = {
  data?: any;
  onEdit: (row: any) => void;
};

const EscalationsList = ({ data, onEdit }: Props) => {
  if (!data) return null;

  return data.map((row: any) => (
    <div key={row?.id}>
      <div className="text-[#2B9AE9] font-bold">{row?.slaDefinitionName}</div>

      {row?.escalations?.map((escalation: any) => (
        <div
          key={escalation?.id}
          className="gap-4 pl-4 my-1 hover:bg-[#F3F4F6] cursor-pointer"
          onClick={() =>
            onEdit({
              ...escalation,
              slaDefinitionId: row?.slaDefinitionId,
              slaDefinitionName: row?.slaDefinitionName,
            })
          }
        >
          <span className="text-[#6B7280] mr-4">
            Trigger:{" "}
            <span className="font-bold text-[#3C3C3C]">
              {escalation?.triggerPercentage}%
            </span>
          </span>
          <span className="text-[#3C3C3C]">
            Action: <span className="font-bold">{escalation?.actionType}</span>
          </span>
        </div>
      ))}
    </div>
  ));
};

export default EscalationsList;
