export const CHART_COLORS = [
  "#2B9AE9", "#2ECC71", "#F1C40F", "#E74C3C", "#9B59B6",
  "#1ABC9C", "#E67E22", "#3498DB", "#E84393", "#00B894",
  "#6C5CE7", "#FD79A8", "#00CEC9", "#FDCB6E", "#636E72",
  "#D63031",
];

export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};
