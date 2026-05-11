import type { HistoryType } from "../../../Types";
import i18n from "../../../i18n";

export const historyFeedTypeOptions: { value: HistoryType; label: string }[] = [
  { value: 0, label: "history.type.0" },
  { value: 1, label: "history.type.1" },
  { value: 2, label: "history.type.2" },
  { value: 3, label: "history.type.3" },
  { value: 4, label: "history.type.4" },
];

export const historyTypeLabel = (type: HistoryType | number | undefined) => {
  const opt = historyFeedTypeOptions.find((o) => o.value === type);
  return opt ? i18n.t(opt.label) : i18n.t("history.type.unknown");
};

export const historyTypeAccent: Record<number, string> = {
  0: "#2B9AE9",
  1: "#E98B2B",
  2: "#9B2BE9",
  3: "#30A712",
  4: "#535353",
};
