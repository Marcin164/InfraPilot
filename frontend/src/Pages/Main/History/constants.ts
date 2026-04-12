import type { HistoryType } from "../../../Types";

export const historyFeedTypeOptions: { value: HistoryType; label: string }[] = [
  { value: 0, label: "Owner change" },
  { value: 1, label: "Repair" },
  { value: 2, label: "Rebuild" },
  { value: 3, label: "Component replacement" },
  { value: 4, label: "Other" },
];

export const historyTypeLabel = (type: HistoryType | number | undefined) => {
  return (
    historyFeedTypeOptions.find((opt) => opt.value === type)?.label ?? "Unknown"
  );
};

export const historyTypeAccent: Record<number, string> = {
  0: "#2B9AE9",
  1: "#E98B2B",
  2: "#9B2BE9",
  3: "#30A712",
  4: "#535353",
};
