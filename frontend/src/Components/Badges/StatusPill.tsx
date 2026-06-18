import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type StatusTone = "green" | "red" | "amber" | "blue" | "gray";

const TONE_CLASSES: Record<StatusTone, string> = {
  green: "text-green-600 bg-green-50 border-green-200",
  red: "text-red-600 bg-red-50 border-red-200",
  amber: "text-amber-600 bg-amber-50 border-amber-200",
  blue: "text-blue-600 bg-blue-50 border-blue-200",
  gray: "text-gray-500 bg-gray-50 border-gray-200",
};

type Props = {
  text: string | number;
  tone?: StatusTone;
  icon?: any;
};

const StatusPill = ({ text, tone = "gray", icon }: Props) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium text-[12px] ${TONE_CLASSES[tone]}`}
  >
    {icon && <FontAwesomeIcon icon={icon} />}
    {text}
  </span>
);

export default StatusPill;
