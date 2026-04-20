import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getUserSettings } from "../Services/settings";
import type { ThemeSetting } from "../Types/settings";

type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeSetting;
  resolvedTheme: ResolvedTheme;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
});

export const useTheme = () => useContext(ThemeContext);

const resolveTheme = (theme: ThemeSetting): ResolvedTheme => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
    staleTime: 5 * 60 * 1000,
  });

  const theme: ThemeSetting = settings?.theme ?? "system";
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(theme),
  );

  useEffect(() => {
    setResolvedTheme(resolveTheme(theme));
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () =>
      setResolvedTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const lang = settings?.language;
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [settings?.language, i18n]);

  const value = useMemo(
    () => ({ theme, resolvedTheme }),
    [theme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
