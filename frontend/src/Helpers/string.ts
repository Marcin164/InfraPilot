export const splitPath = (path: string, splitSign: string): string[] => {
  return path
    .split(splitSign) // podział po "/"
    .filter(Boolean); // usunięcie pustych elementów (np. z początku "/")
};

export const capitalize = (text: string) => {
  if (!text) return "";
  return text
    .split("")
    .map((char, index) => (index === 0 ? char.toUpperCase() : char))
    .join("");
};
