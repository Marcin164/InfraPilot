import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faBell, faCheck, faEnvelope, faFlask, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import Input from "../../../../Components/Inputs/Input";
import {
  listNotificationPreferences,
  updateNotificationPreferences,
  testNotification,
  EVENT_LABELS,
  NotificationChannel,
  NotificationEvent,
  PreferenceRow,
  type TestResult,
} from "../../../../Services/notificationPreferences";
import { getUserSettings, updateUserSettings } from "../../../../Services/settings";

const TestBadge = ({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string | null;
}) => (
  <div
    className="flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[13px]"
    style={{
      borderColor: ok ? "#30A712" : "#F3606E",
      backgroundColor: ok ? "#F0FBF0" : "#FFF0F0",
    }}
  >
    <span
      className="font-bold"
      style={{ color: ok ? "#30A712" : "#F3606E" }}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
    {detail && (
      <span className="text-[#9a9a9a] text-[11px]">{detail}</span>
    )}
  </div>
);

const CHANNEL_KEYS: {
  key: NotificationChannel;
  labelKey: string;
  hintKey: string;
  color: string;
}[] = [
  { key: "inapp", labelKey: "settings.notif.channel.inapp", hintKey: "settings.notif.channel.inapp.hint", color: "#2B9AE9" },
  { key: "email", labelKey: "settings.notif.channel.email", hintKey: "settings.notif.channel.email.hint", color: "#16A085" },
  { key: "sms", labelKey: "settings.notif.channel.sms", hintKey: "settings.notif.channel.sms.hint", color: "#F1C40F" },
];

const NotificationPreferences = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const CHANNELS = CHANNEL_KEYS.map((c) => ({ ...c, label: t(c.labelKey), hint: t(c.hintKey) }));

  // ── Notification matrix ──────────────────────────────────────────
  const prefsQuery = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: listNotificationPreferences,
  });

  const [draft, setDraft] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (prefsQuery.data) {
      const m = new Map<string, boolean>();
      for (const r of prefsQuery.data) m.set(`${r.event}:${r.channel}`, r.enabled);
      setDraft(m);
    }
  }, [prefsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (rows: PreferenceRow[]) => updateNotificationPreferences(rows),
    onSuccess: () => {
      toast.success(t("toast.success.preferencesSaved"));
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("users.auth.saveFailed")),
  });

  const toggle = (event: NotificationEvent, channel: NotificationChannel) => {
    const key = `${event}:${channel}`;
    setDraft((prev) => {
      const next = new Map(prev);
      next.set(key, !prev.get(key));
      return next;
    });
  };

  const saveMatrix = () => {
    const rows: PreferenceRow[] = [];
    for (const [key, enabled] of draft) {
      const [event, channel] = key.split(":") as [NotificationEvent, NotificationChannel];
      rows.push({ event, channel, enabled });
    }
    saveMutation.mutate(rows);
  };

  const events = Array.from(
    new Set((prefsQuery.data ?? []).map((r) => r.event)),
  ) as NotificationEvent[];

  // ── Contact details ──────────────────────────────────────────────
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  const [notifEmail, setNotifEmail] = useState("");
  const [notifPhone, setNotifPhone] = useState("");

  useEffect(() => {
    if (settingsQuery.data) {
      setNotifEmail(settingsQuery.data.notifEmail ?? "");
      setNotifPhone(settingsQuery.data.notifPhone ?? "");
    }
  }, [settingsQuery.data]);

  const contactMutation = useMutation({
    mutationFn: () =>
      updateUserSettings({
        notifEmail: notifEmail.trim() || null,
        notifPhone: notifPhone.trim() || null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      toast.success(t("toast.success.preferencesSaved"));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("users.auth.saveFailed")),
  });

  const contactDirty =
    (notifEmail.trim() || null) !== (settingsQuery.data?.notifEmail ?? null) ||
    (notifPhone.trim() || null) !== (settingsQuery.data?.notifPhone ?? null);

  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const testMutation = useMutation({
    mutationFn: testNotification,
    onSuccess: (result) => {
      setTestResult(result);
      toast.success(t("settings.notif.test.sent"));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.notif.test.failed")),
  });

  return (
    <div className="m-4 space-y-4">

      {/* Contact details card */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.notif.contacts.title")} icon={faBell} />
        <p className="text-[13px] text-[#9a9a9a] mt-1 mb-4">
          {t("settings.notif.contacts.help")}
        </p>

        <div className="flex flex-col gap-1 max-w-[420px]">
          <Input
            label={t("settings.notif.contacts.email")}
            name="notifEmail"
            value={notifEmail}
            handleChange={setNotifEmail}
            placeholder={t("settings.notif.contacts.emailPlaceholder")}
          />
          <Input
            label={t("settings.notif.contacts.phone")}
            name="notifPhone"
            value={notifPhone}
            handleChange={setNotifPhone}
            placeholder={t("settings.notif.contacts.phonePlaceholder")}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ButtonPrimary
            icon={faCheck}
            text={contactMutation.isPending ? t("common.saving") : t("common.save")}
            onClick={() => contactMutation.mutate()}
            disabled={contactMutation.isPending || !contactDirty}
          />
          <ButtonPrimary
            icon={faFlask}
            color="white"
            text={testMutation.isPending ? t("settings.notif.test.sending") : t("settings.notif.test.btn")}
            onClick={() => { setTestResult(null); testMutation.mutate(); }}
            disabled={testMutation.isPending}
          />
        </div>

        {testResult && (
          <div className="mt-4 flex flex-wrap gap-3">
            <TestBadge
              label={t("settings.notif.channel.inapp")}
              ok={testResult.inapp}
              detail={null}
            />
            <TestBadge
              label={t("settings.notif.channel.email")}
              ok={testResult.email}
              detail={testResult.emailAddress}
            />
            <TestBadge
              label={t("settings.notif.channel.sms")}
              ok={testResult.sms}
              detail={testResult.phone}
            />
          </div>
        )}
      </div>

      {/* Preferences matrix card */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.notif.title")} icon={faBell} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          {t("settings.notif.helpSms")}
        </p>

        {prefsQuery.isLoading ? (
          <div className="mt-4 text-[13px] text-[#7a7a7a]">{t("common.loading")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-4 w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase text-[#9a9a9a]">
                  <th className="py-2">{t("settings.notif.event")}</th>
                  {CHANNELS.map((c) => (
                    <th key={c.key} className="py-2 text-center w-[110px]">
                      {c.label}
                      <div className="text-[10px] font-normal text-[#9a9a9a] normal-case">
                        {c.hint}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event} className="border-t border-[#F0F0F0]">
                    <td className="py-2 text-[#3C3C3C]">
                      {t(`notif.event.${event}`, { defaultValue: EVENT_LABELS[event] ?? event })}
                    </td>
                    {CHANNELS.map((c) => {
                      const key = `${event}:${c.key}`;
                      const on = draft.get(key) ?? false;
                      return (
                        <td key={c.key} className="py-2">
                          <div className="flex justify-center">
                            <Checkbox
                              id={key}
                              checked={on}
                              color={c.color}
                              handleChange={() => toggle(event, c.key)}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <ButtonPrimary
            icon={faCheck}
            text={saveMutation.isPending ? t("common.saving") : t("common.save")}
            onClick={saveMatrix}
            disabled={saveMutation.isPending || draft.size === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
