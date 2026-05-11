import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faBell, faCheck } from "@fortawesome/free-solid-svg-icons";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import {
  listNotificationPreferences,
  updateNotificationPreferences,
  EVENT_LABELS,
  NotificationChannel,
  NotificationEvent,
  PreferenceRow,
} from "../../../../Services/notificationPreferences";

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

  const prefsQuery = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: listNotificationPreferences,
  });

  const [draft, setDraft] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (prefsQuery.data) {
      const m = new Map<string, boolean>();
      for (const r of prefsQuery.data) {
        m.set(`${r.event}:${r.channel}`, r.enabled);
      }
      setDraft(m);
    }
  }, [prefsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (rows: PreferenceRow[]) => updateNotificationPreferences(rows),
    onSuccess: () => {
      toast.success(t("toast.success.preferencesSaved"));
      queryClient.invalidateQueries({
        queryKey: ["notification-preferences"],
      });
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

  const save = () => {
    const rows: PreferenceRow[] = [];
    for (const [key, enabled] of draft) {
      const [event, channel] = key.split(":") as [
        NotificationEvent,
        NotificationChannel,
      ];
      rows.push({ event, channel, enabled });
    }
    saveMutation.mutate(rows);
  };

  const events = Array.from(
    new Set((prefsQuery.data ?? []).map((r) => r.event)),
  ) as NotificationEvent[];

  return (
    <div className="m-4 bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("settings.notif.title")} icon={faBell} />
      <p className="text-[12px] text-[#7a7a7a] mt-2">
        {t("settings.notif.helpSms")}
      </p>

      {prefsQuery.isLoading ? (
        <div className="mt-4 text-[13px] text-[#7a7a7a]">{t("common.loading")}</div>
      ) : (
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
      )}

      <div className="mt-4">
        <ButtonPrimary
          icon={faCheck}
          text={saveMutation.isPending ? t("common.saving") : t("common.save")}
          onClick={save}
          disabled={saveMutation.isPending || draft.size === 0}
        />
      </div>
    </div>
  );
};

export default NotificationPreferences;
