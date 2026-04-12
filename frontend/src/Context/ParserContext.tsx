import React, { createContext, useCallback, useState } from "react";

type ParserMap = Record<string, string>;

type ParserContextType = {
  parsers: ParserMap;
  setParsers: (entries: ParserMap) => void;
  /** @deprecated Use setParsers instead — kept for backward compat */
  parser: { id?: string; name?: string } | null;
  /** @deprecated Use setParsers instead */
  setParser: React.Dispatch<
    React.SetStateAction<{ id?: string; name?: string } | null>
  >;
};

export const ParserContext = createContext<ParserContextType | undefined>(
  undefined,
);

export const ParseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [parsers, _setParsers] = useState<ParserMap>({});
  const [legacyParser, setLegacyParser] = useState<{
    id?: string;
    name?: string;
  } | null>(null);

  const setParsers = useCallback((entries: ParserMap) => {
    _setParsers(entries);
  }, []);

  return (
    <ParserContext.Provider
      value={{
        parsers,
        setParsers,
        parser: legacyParser,
        setParser: setLegacyParser,
      }}
    >
      {children}
    </ParserContext.Provider>
  );
};
