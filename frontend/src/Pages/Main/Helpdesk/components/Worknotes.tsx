import React from "react";
import { useTranslation } from "react-i18next";

type Props = {};

const Worknotes = (props: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-[30%] bg-[#F3F2A0] shadow-xl p-4 ml-[52%] my-4 border-2 border-[#9F9D00]">
      <div className="text-[14px] font-light">{t("helpdesk.description")}</div>
      <div className="font-bold">{t("helpdesk.details")}</div>
    </div>
  );
};

export default Worknotes;
