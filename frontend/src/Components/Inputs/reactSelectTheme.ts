export const getReactSelectTheme = (isDark: boolean) => (base: any) => ({
  ...base,
  colors: isDark
    ? {
        ...base.colors,
        primary: "#2B9AE9",
        primary75: "#1E86D1",
        primary50: "#153247",
        primary25: "#1D323F",
        danger: "#F53B3B",
        dangerLight: "#44181B",
        neutral0: "#1A1F26",
        neutral5: "#1E2530",
        neutral10: "#2A2F38",
        neutral20: "#3A404B",
        neutral30: "#4A515D",
        neutral40: "#6B7280",
        neutral50: "#9AA3AE",
        neutral60: "#B1B5BE",
        neutral70: "#C8CDD5",
        neutral80: "#E5E7EB",
        neutral90: "#F3F4F6",
      }
    : base.colors,
});

export const selectTextColor = (isDark: boolean, active: boolean) => {
  if (active) return "#FFFFFF";
  return isDark ? "#E5E7EB" : "#3C3C3C";
};

export const selectOptionBg = (active: boolean) =>
  active ? "#2B9AE9AA" : "transparent";

export const selectBorderColor = (isDark: boolean) =>
  isDark ? "#3A404B" : "#3C3C3C";
