export const today = new Date().toISOString().split("T")[0];

export const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const minutesToDaysHoursMinutes = (minutes: number): string => {
  const minutesInDay = 24 * 60;

  const days = Math.floor(minutes / minutesInDay);
  const remainingMinutes = minutes % minutesInDay;

  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  const hh = hours.toString().padStart(2, "0");
  const mm = mins.toString().padStart(2, "0");

  return `${days} dni, ${hh}:${mm}`;
};
