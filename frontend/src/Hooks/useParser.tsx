import React, { createContext, useContext, useState } from "react";

const ParserContext = createContext<any>(undefined);

export const ParseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [parser, setParser] = useState<any>(null);

  return (
    <ParserContext.Provider value={{ parser, setParser }}>
      {children}
    </ParserContext.Provider>
  );
};

export const useParser = () => {
  const context = useContext(ParserContext);
  if (!context) {
    throw new Error("useParser must be used inside ParseProvider");
  }
  return context;
};
