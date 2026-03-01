import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const Calendar = ({
  holidays,
  onChange,
}: {
  holidays: Date[];
  onChange: (dates?: Date[]) => void;
}) => {
  return (
    <DayPicker
      mode="multiple"
      selected={holidays}
      onSelect={onChange}
      weekStartsOn={1}
    />
  );
};

export default Calendar;
