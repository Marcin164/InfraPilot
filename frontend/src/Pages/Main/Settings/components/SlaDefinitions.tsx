import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CardHeader from "../../../../Components/Headers/CardHeader";
import SLaDefinitionsTable from "../../../../Components/Tables/SLaDefinitionsTable";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import EditDefinitionModal from "../../../../Components/Modals/EditDefinitionModal";

type Props = {
  slaDefinitions: any;
};

const SlaDefinitions = ({ slaDefinitions }: Props) => {
  const { t } = useTranslation();
  const [isEditDefinitionModalOpen, setIsEditDefinitionModalOpen] =
    useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<any | null>(
    null,
  );

  if (!slaDefinitions) return null;

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
        <CardHeader text={t("settings.definitions")} />
        <ButtonPrimary
          icon={faPlus}
          text={t("btn.add.definition")}
          onClick={openAddDefinitionModal}
        />
      </div>
      <SLaDefinitionsTable
        data={slaDefinitions}
        onEdit={openEditDefinitionModal}
      />
      <EditDefinitionModal
        data={selectedDefinition}
        isModalOpen={isEditDefinitionModalOpen}
        handleOnClose={closeDefinitionModal}
      />
    </div>
  );
};

export default SlaDefinitions;
