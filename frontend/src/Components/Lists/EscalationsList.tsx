import React from "react";

type Props = {
  slaDefinitions?: any;
};

const EscalationsList = ({ slaDefinitions }: Props) => {
  if (!slaDefinitions) return null;
  return (
    <div>
      <div>Escalation for: {slaDefinitions?.name}</div>
      <div>
        {slaDefinitions?.escalations.map((escalation: any) => (
          <div key={escalation.id}>
            <div>Trigger: {escalation.triggerPercentage}%</div>
            <div>Action: {escalation.actionType}</div>
            <div>Config: {JSON.stringify(escalation.actionConfig)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EscalationsList;
