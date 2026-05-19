import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoon,
  faSun,
  faDesktop,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserSettings,
  updateUserSettings,
} from "../../../../Services/settings";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import type {
  DateFormat,
  StartPage,
  ThemeSetting,
  TimeFormat,
  UserSettings,
} from "../../../../Types/settings";

const LANG_OPTIONS_KEYS = [
  { value: "pl", labelKey: "settings.personal.language.pl" },
  { value: "en", labelKey: "settings.personal.language.en" },
];

const START_PAGE_KEYS: Array<{ value: StartPage; labelKey: string }> = [
  { value: "dashboards", labelKey: "nav.dashboards" },
  { value: "users", labelKey: "nav.users" },
  { value: "devices", labelKey: "nav.devices" },
  { value: "helpdesk", labelKey: "nav.helpdesk" },
  { value: "knowledge", labelKey: "nav.knowledge" },
  { value: "history", labelKey: "nav.history" },
  { value: "reports", labelKey: "nav.reports" },
];

const DATE_FORMAT_OPTIONS: Array<{ value: DateFormat; label: string }> = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-12-31)" },
];

const TIME_FORMAT_KEYS: Array<{ value: TimeFormat; labelKey: string }> = [
  { value: "24h", labelKey: "settings.personal.timeFormat.24h" },
  { value: "12h", labelKey: "settings.personal.timeFormat.12h" },
];

const PAGE_SIZE_VALUES = [10, 25, 50, 100];

type ThemeTileProps = {
  label: string;
  icon: typeof faSun;
  active: boolean;
  onClick: () => void;
};

const ThemeTile = ({ label, icon, active, onClick }: ThemeTileProps) => (
  <button
    type="button"
    onClick={onClick}
    className={twMerge(
      "relative flex w-[120px] flex-col items-center gap-2 rounded-[12px] border-2 px-4 py-4 transition-all",
      active
        ? "border-[#2B9AE9] bg-[#EBF5FE] shadow-md"
        : "border-[#E0E0E0] bg-white hover:border-[#B5D9F5]",
    )}
  >
    <FontAwesomeIcon
      icon={icon}
      className={twMerge(
        "text-[24px]",
        active ? "text-[#2B9AE9]" : "text-[#8A8A8A]",
      )}
    />
    <span
      className={twMerge(
        "text-[14px] font-semibold",
        active ? "text-[#2B9AE9]" : "text-[#3C3C3C]",
      )}
    >
      {label}
    </span>
    {active && (
      <FontAwesomeIcon
        icon={faCheck}
        className="absolute right-2 top-2 text-[12px] text-[#2B9AE9]"
      />
    )}
  </button>
);

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="border-b border-[#E8E8E8] pb-6 last:border-b-0 last:pb-0">
    <h3 className="text-[16px] font-bold text-[#3C3C3C]">{title}</h3>
    {description && (
      <p className="mb-3 mt-1 text-[13px] text-[#8A8A8A]">{description}</p>
    )}
    <div className={description ? "" : "mt-3"}>{children}</div>
  </div>
);

const findOption = <T extends string | number>(
  options: Array<{ value: T; label: string }>,
  value: T | undefined,
) => options.find((o) => o.value === value) ?? null;

const Personal = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const LANG_OPTIONS = LANG_OPTIONS_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const START_PAGE_OPTIONS = START_PAGE_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const TIME_FORMAT_OPTIONS = TIME_FORMAT_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  const PAGE_SIZE_OPTIONS = PAGE_SIZE_VALUES.map((v) => ({ value: v, label: t("settings.personal.pageSize.rows", { count: v }) }));

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  const [draft, setDraft] = useState<Partial<UserSettings>>({});

  const merged: Partial<UserSettings> = useMemo(
    () => ({ ...(data ?? {}), ...draft }),
    [data, draft],
  );

  const mutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      setDraft({});
      toast.success(t("toast.success.settingsSaved"));
    },
    onError: () => {
      toast.error(t("toast.error.settingsSave"));
    },
  });

  const update = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const isDirty = Object.keys(draft).length > 0;

  if (isLoading) {
    return (
      <div className="m-4 rounded-[10px] bg-white p-6 shadow-xl">
        {t("settings.personal.loading")}
      </div>
    );
  }

  const theme = (merged.theme ?? "system") as ThemeSetting;

  return (
    <div className="m-4 space-y-6 rounded-[10px] bg-white p-6 shadow-xl">
      <Section
        title={t("settings.personal.theme")}
        description={t("settings.personal.theme.desc")}
      >
        <div className="flex flex-wrap gap-3">
          <ThemeTile
            label={t("settings.personal.theme.light")}
            icon={faSun}
            active={theme === "light"}
            onClick={() => update("theme", "light")}
          />
          <ThemeTile
            label={t("settings.personal.theme.dark")}
            icon={faMoon}
            active={theme === "dark"}
            onClick={() => update("theme", "dark")}
          />
          <ThemeTile
            label={t("settings.personal.theme.system")}
            icon={faDesktop}
            active={theme === "system"}
            onClick={() => update("theme", "system")}
          />
        </div>
      </Section>

      <Section
        title={t("settings.personal.language")}
        description={t("settings.personal.language.desc")}
      >
        <SelectSecondary
          label=""
          options={LANG_OPTIONS}
          value={findOption(LANG_OPTIONS, merged.language as string)}
          onSelect={(opt: { value: string }) =>
            update("language", opt?.value ?? "en")
          }
          className="w-full sm:w-[300px]"
        />
      </Section>

      <Section
        title={t("settings.personal.startPage")}
        description={t("settings.personal.startPage.desc")}
      >
        <SelectSecondary
          label=""
          options={START_PAGE_OPTIONS}
          value={findOption(START_PAGE_OPTIONS, merged.startPage as StartPage)}
          onSelect={(opt: { value: StartPage }) =>
            update("startPage", opt?.value ?? "dashboards")
          }
          className="w-full sm:w-[300px]"
        />
      </Section>

      <Section
        title={t("settings.personal.dateFormat")}
        description={t("settings.personal.dateFormat.desc")}
      >
        <SelectSecondary
          label=""
          options={DATE_FORMAT_OPTIONS}
          value={findOption(DATE_FORMAT_OPTIONS, merged.dateFormat as DateFormat)}
          onSelect={(opt: { value: DateFormat }) =>
            update("dateFormat", opt?.value ?? "DD/MM/YYYY")
          }
          className="w-full sm:w-[300px]"
        />
      </Section>

      <Section
        title={t("settings.personal.timeFormat")}
        description={t("settings.personal.timeFormat.desc")}
      >
        <SelectSecondary
          label=""
          options={TIME_FORMAT_OPTIONS}
          value={findOption(TIME_FORMAT_OPTIONS, merged.timeFormat as TimeFormat)}
          onSelect={(opt: { value: TimeFormat }) =>
            update("timeFormat", opt?.value ?? "24h")
          }
          className="w-full sm:w-[300px]"
        />
      </Section>

      <Section
        title={t("settings.personal.pageSize")}
        description={t("settings.personal.pageSize.desc")}
      >
        <SelectSecondary
          label=""
          options={PAGE_SIZE_OPTIONS}
          value={findOption(PAGE_SIZE_OPTIONS, merged.defaultPageSize ?? 25)}
          onSelect={(opt: { value: number }) =>
            update("defaultPageSize", opt?.value ?? 25)
          }
          className="w-full sm:w-[300px]"
        />
      </Section>

      <Section
        title={t("settings.personal.density")}
        description={t("settings.personal.density.desc")}
      >
        <Checkbox
          label={t("settings.personal.density.compact")}
          checked={!!merged.compactMode}
          onChange={() => update("compactMode", !merged.compactMode)}
        />
      </Section>

      <div className="flex items-center justify-end gap-3 pt-2">
        {isDirty && (
          <button
            type="button"
            onClick={() => setDraft({})}
            className="rounded-[10px] px-4 py-2 text-[14px] font-semibold text-[#8A8A8A] hover:text-[#3C3C3C]"
          >
            {t("common.cancel")}
          </button>
        )}
        <button
          type="button"
          onClick={() => mutation.mutate(draft)}
          disabled={!isDirty || mutation.isPending}
          className={twMerge(
            "rounded-[10px] bg-[#2B9AE9] px-5 py-2 text-[14px] font-semibold text-white shadow-md transition-colors",
            "hover:bg-[#3CABFA] disabled:cursor-not-allowed disabled:bg-[#A7CDEE]",
          )}
        >
          {mutation.isPending ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );
};

export default Personal;
