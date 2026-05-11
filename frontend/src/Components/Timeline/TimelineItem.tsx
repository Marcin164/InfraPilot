import { faMinus, faMouse, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type Props = {
  date: any;
  ticket: string;
  components: any;
  details: any;
  justification: any;
  approvers: any;
  owner: any;
  device: any;
};

const TimelineItem = ({
  date,
  ticket,
  components,
  details,
  justification,
  approvers,
  owner,
  device,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="ml-[20px] pb-4">
      <div>
        <span className="text-[#535353] font-bold">{date}</span>
        <span className="text-[#2B9AE9] font-bold ml-2">
          {ticket && t("timeline.ticketPrefix", { number: ticket })}
        </span>
      </div>
      {components &&
        components?.length > 0 &&
        components.map((component: any) => (
          <div className="py-1 flex justify-between">
            <span>
              <FontAwesomeIcon
                icon={component.type === "remove" ? faMinus : faPlus}
                className={
                  component.type === "remove"
                    ? "text-[#BC0E0E] pr-2 text-[20px]"
                    : "text-[#30A712] pr-2 text-[20px]"
                }
              />
              <FontAwesomeIcon icon={faMouse} className="pr-2 text-[#535353]" />
              <span className="text-[#535353]">{`${component.manufacturer} ${component.model}, ${component.serialNumber}`}</span>
            </span>
            <span className="bg-[#2B9AE9] px-2 py-1 text-[#FFFFFF] rounded-[10px] font-bold">
              {component.location}
            </span>
          </div>
        ))}
      {owner && (
        <span className="text-[18px] text-[#2B9AE9] font-light">{owner}</span>
      )}
      {device && typeof device === "string" && (
        <span className="text-[18px] text-[#2B9AE9] font-light">{device}</span>
      )}
      {details && (
        <div className="py-1">
          <div className="text-[#535353] font-bold">{t("form.field.details")}</div>
          <span className="text-[#3C3C3C] font-light italic">{details}</span>
        </div>
      )}
      {justification && (
        <div className="py-1">
          <div className="text-[#535353] font-bold">{t("form.field.justification")}</div>
          <span className="text-[#3C3C3C] font-light italic">
            {justification}
          </span>
        </div>
      )}
      {approvers && approvers.length > 0 && (
        <div className="py-1">
          <div className="text-[#535353] font-bold">{t("form.field.approvers")}</div>
          <span className="text-[#3C3C3C] font-light italic">
            {approvers.map((approver: any, index: number) => (
              <>
                {approver?.user && (
                  <Link to={`/admin/users/${approver.user.id}`}>
                    {approver.user.distinguishedName}
                  </Link>
                )}
                {index !== approvers.length - 1 && (
                  <span className="px-2">&bull;</span>
                )}
              </>
            ))}
          </span>
        </div>
      )}
    </div>
  );
};

export default TimelineItem;
