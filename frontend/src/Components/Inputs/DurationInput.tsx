import { useState } from "react";
import { useTranslation } from "react-i18next";

type Unit = "minutes" | "hours" | "days";

const MINUTES_PER_UNIT: Record<Unit, number> = {
  minutes: 1,
  hours: 60,
  // Approximate -- for input convenience only. The actual due date is
  // computed against the calendar's real working hours, not this constant.
  days: 8 * 60,
};

type Props = {
  label?: string;
  valueMinutes: number | null | undefined;
  onChangeMinutes: (minutes: number | null) => void;
  errors?: any;
};

const DurationInput = ({ label, valueMinutes, onChangeMinutes, errors }: Props) => {
  const { t } = useTranslation();
  const [unit, setUnit] = useState<Unit>("hours");

  const displayValue =
    valueMinutes == null ? "" : String(Math.round((valueMinutes / MINUTES_PER_UNIT[unit]) * 100) / 100);

  const handleAmountChange = (raw: string) => {
    if (raw === "") {
      onChangeMinutes(null);
      return;
    }
    const amount = Number(raw);
    if (Number.isNaN(amount)) return;
    onChangeMinutes(Math.round(amount * MINUTES_PER_UNIT[unit]));
  };

  const handleUnitChange = (nextUnit: Unit) => {
    setUnit(nextUnit);
  };

  return (
    <div className="pt-2">
      {label && <label className="font-bold text-[#3C3C3C]">{label}</label>}
      <div className="flex mt-[6px]">
        <input
          type="number"
          min="0"
          step="any"
          value={displayValue}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="w-full border border-[#535353] bg-[#FFFFFF] text-[16px] font-bold block rounded-l-[10px] px-3 py-2"
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value as Unit)}
          className="border-y border-r border-[#535353] bg-white text-[14px] font-bold rounded-r-[10px] px-2"
        >
          <option value="minutes">{t("form.duration.unit.minutes")}</option>
          <option value="hours">{t("form.duration.unit.hours")}</option>
          <option value="days">{t("form.duration.unit.days")}</option>
        </select>
      </div>
      {errors && (
        <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
          {errors}
        </em>
      )}
    </div>
  );
};

export default DurationInput;
