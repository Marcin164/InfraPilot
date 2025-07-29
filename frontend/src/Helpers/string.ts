export const splitPath = (path: string, splitSign: string): string[] => {
  return path
    .split(splitSign) // podział po "/"
    .filter(Boolean); // usunięcie pustych elementów (np. z początku "/")
};
