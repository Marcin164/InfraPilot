import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import SlaRulesTable from "../../../../Components/Tables/SlaRulesTable";
import EditRuleModal from "../../../../Components/Modals/EditRuleModal";

type Props = {
  slaRules: any;
};

const SlaRules = ({ slaRules }: Props) => {
  const { t } = useTranslation();
  const [isEditDefinitionModalOpen, setIsEditDefinitionModalOpen] =
    useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<any | null>(
    null,
  );

  if (!slaRules) return null;

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
        <CardHeader text={t("settings.rules")} />
        <ButtonPrimary
          icon={faPlus}
          text={t("btn.add.rule")}
          onClick={openAddDefinitionModal}
        />
      </div>
      <SlaRulesTable data={slaRules} onEdit={openEditDefinitionModal} />
      <EditRuleModal
        data={selectedDefinition}
        isModalOpen={isEditDefinitionModalOpen}
        handleOnClose={closeDefinitionModal}
      />
    </div>
  );
};

export default SlaRules;
