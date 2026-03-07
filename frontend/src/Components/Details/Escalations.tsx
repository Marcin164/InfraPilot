import React, { useState } from "react";
import CardHeader from "../Headers/CardHeader";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import EscalationsList from "../Lists/EscalationsList";
import EditEscalationModal from "../Modals/EditEscalationModal";

type Props = {
  escalations: any[];
};

const Escalations = ({ escalations }: Props) => {
  const [isEditDefinitionModalOpen, setIsEditDefinitionModalOpen] =
    useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<any | null>(
    null,
  );

  const openAddDefinitionModal = () => {
    setSelectedDefinition(null);
    setIsEditDefinitionModalOpen(true);
  };

  const openEditDefinitionModal = (row: any) => {
    setSelectedDefinition(row);
    setIsEditDefinitionModalOpen(true);
  };

  const closeDefinitionModal = () => {
    setIsEditDefinitionModalOpen(false);
    setSelectedDefinition(null);
  };
  return (
    <div className="w-full h-[300px] overflow-y-auto bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <CardHeader text="Escalations" />
        <ButtonPrimary
          icon={faPlus}
          text="Add escalation"
          onClick={openAddDefinitionModal}
        />
      </div>
      <EscalationsList data={escalations} onEdit={openEditDefinitionModal} />
      <EditEscalationModal
        data={selectedDefinition}
        isModalOpen={isEditDefinitionModalOpen}
        handleOnClose={closeDefinitionModal}
      />
    </div>
  );
};

export default Escalations;
