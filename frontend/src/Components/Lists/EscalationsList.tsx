import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

type Props = {
  data?: any;
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
};

const EscalationsList = ({ data, onEdit, onDelete }: Props) => {
  if (!data) return null;

  return data.map((row: any) => (
    <div key={row?.id}>
      <div className="text-[#2B9AE9] font-bold">{row?.slaDefinitionName}</div>

      {row?.escalations?.map((escalation: any) => (
        <div
          key={escalation?.id}
          className="flex items-center justify-between gap-4 pl-4 pr-2 my-1 rounded hover:bg-[#F3F4F6]"
        >
          <div
            className="flex flex-1 flex-wrap gap-4 cursor-pointer"
            onClick={() =>
              onEdit({
                ...escalation,
                slaDefinitionId: row?.slaDefinitionId,
                slaDefinitionName: row?.slaDefinitionName,
              })
            }
          >
            <span className="text-[#6B7280]">
              Trigger:{" "}
              <span className="font-bold text-[#3C3C3C]">
                {escalation?.triggerPercentage}%
              </span>
            </span>
            <span className="text-[#3C3C3C]">
              Action: <span className="font-bold">{escalation?.actionType}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(escalation);
            }}
            className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ))}
    </div>
  ));
};

export default EscalationsList;
