export const splitPath = (path: string, splitSign: string): string[] => {
  return path
    .split(splitSign) // podział po "/"
    .filter(Boolean); // usunięcie pustych elementów (np. z początku "/")
};

export const capitalize = (text: string) => {
  if (!text) return "";
  return text[0].toUpperCase() + text.slice(1);
};
