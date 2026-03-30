import { useContext } from "react";
import { ParserContext } from "../Context/ParserContext";

export const useParser = () => {
  const context = useContext(ParserContext);
  if (!context) {
    throw new Error("useParser must be used inside ParseProvider");
  }
  return context;
};
