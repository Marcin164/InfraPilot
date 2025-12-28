import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TimelineLine from "../Timeline/TimelineLine";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type HistorySectionProps = {
  title: string;
  emptyText: string;
  items: any[];
  buttonText: string;
  buttonIcon: any;
  onButtonClick: () => void;
  children: React.ReactNode;
};

const HistorySection = ({
  title,
  emptyText,
  items,
  buttonText,
  buttonIcon,
  onButtonClick,
  children,
}: HistorySectionProps) => {
  return (
    <div className="w-full rounded-[10px] bg-white p-4 shadow-xl">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">{title}</div>

      <div className="max-h-[calc(100vh-315px)] overflow-y-scroll pl-2">
        {items.length > 0 ? (
          <TimelineLine items={items} />
        ) : (
          <div>{emptyText}</div>
        )}
      </div>

      <div className="pt-4">
        <ButtonPrimary
          icon={buttonIcon}
          text={buttonText}
          onClick={onButtonClick}
        />
        {children}
      </div>
    </div>
  );
};

export default HistorySection;
