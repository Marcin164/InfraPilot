import React, { createContext, useState } from "react";

type ParserValue = {
  id?: string;
  name?: string;
};

type ParserContextType = {
  parser: ParserValue | null;
  setParser: React.Dispatch<React.SetStateAction<ParserValue | null>>;
};

export const ParserContext = createContext<ParserContextType | undefined>(
  undefined,
);

export const ParseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [parser, setParser] = useState<ParserValue | null>(null);

  return (
    <ParserContext.Provider value={{ parser, setParser }}>
      {children}
    </ParserContext.Provider>
  );
};
