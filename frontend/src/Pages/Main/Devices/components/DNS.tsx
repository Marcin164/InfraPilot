import { useTranslation } from "react-i18next";

type Props = {
  servers: any;
};

const DNS = ({ servers }: Props) => {
  const { t } = useTranslation();
  const list = servers ?? [];
  if (list.length === 0) return null;
  return (
    <div>
      <span className="text-[#7a7a7a] font-light text-[13px]">
        {t("device.section.dns")}:{" "}
      </span>
      <span className="text-[#3C3C3C] font-semibold text-[13px]">
        {list.join(", ")}
      </span>
    </div>
  );
};

export default DNS;
