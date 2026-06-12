import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faRobot, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ticketAssist, type TicketAssistResult } from "../../../../Services/ai";
import { updateTicket } from "../../../../Services/tickets";

type Props = {
  ticket: any;
};

const AIAssistPanel = ({ ticket }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<TicketAssistResult | null>(null);

  const assistMutation = useMutation({
    mutationFn: () =>
      ticketAssist({
        description: ticket.description ?? "",
        category: ticket.category,
        deviceInfo: ticket.device?.assetName ?? ticket.device?.serialNumber,
      }),
    onSuccess: (data) => setResult(data),
    onError: () => toast.error(t("ai.error")),
  });

  const applyMutation = useMutation({
    mutationFn: (updates: { title?: string; description?: string }) =>
      updateTicket(ticket.id, updates),
    onSuccess: () => {
      toast.success(t("ai.applied"));
      queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
    },
    onError: () => toast.error(t("ai.applyError")),
  });

  return (
    <div className="mt-4 rounded-[8px] border border-[#D6EAF8] bg-[#EBF5FB] p-3">
      <div className="flex items-center gap-2 mb-2">
        <FontAwesomeIcon icon={faRobot} className="text-[#2B9AE9]" />
        <span className="text-[13px] font-bold text-[#3C3C3C]">
          {t("ai.title")}
        </span>
        {!result && (
          <button
            type="button"
            onClick={() => assistMutation.mutate()}
            disabled={assistMutation.isPending}
            className="ml-auto text-[11px] px-2 py-0.5 rounded bg-[#2B9AE9] text-white font-semibold hover:bg-[#1a7fc1] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {assistMutation.isPending && (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            )}
            {assistMutation.isPending ? t("ai.analyzing") : t("ai.analyze")}
          </button>
        )}
        {result && (
          <button
            type="button"
            onClick={() => {
              setResult(null);
              assistMutation.mutate();
            }}
            disabled={assistMutation.isPending}
            className="ml-auto text-[11px] px-2 py-0.5 rounded bg-[#7F8C8D] text-white font-semibold hover:bg-[#5D6D7E] disabled:opacity-50 flex items-center gap-1"
          >
            {assistMutation.isPending && (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            )}
            {t("ai.reanalyze")}
          </button>
        )}
      </div>

      {result && (
        <div className="space-y-3">
          {result.title && (
            <div className="rounded-[6px] bg-white border border-[#D6EAF8] p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-[#9a9a9a] uppercase">
                  {t("ai.suggestedTitle")}
                </span>
                <button
                  type="button"
                  onClick={() => applyMutation.mutate({ title: result.title })}
                  disabled={applyMutation.isPending}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#27AE60] text-white font-semibold hover:bg-[#1E8449] flex items-center gap-1 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCheck} />
                  {t("ai.apply")}
                </button>
              </div>
              <p className="text-[12px] text-[#3C3C3C]">{result.title}</p>
            </div>
          )}

          {result.improvedDescription && (
            <div className="rounded-[6px] bg-white border border-[#D6EAF8] p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-[#9a9a9a] uppercase">
                  {t("ai.improvedDescription")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    applyMutation.mutate({
                      description: result.improvedDescription,
                    })
                  }
                  disabled={applyMutation.isPending}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#27AE60] text-white font-semibold hover:bg-[#1E8449] flex items-center gap-1 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCheck} />
                  {t("ai.apply")}
                </button>
              </div>
              <p className="text-[12px] text-[#535353] whitespace-pre-line">
                {result.improvedDescription}
              </p>
            </div>
          )}

          {result.solutions && result.solutions.length > 0 && (
            <div className="rounded-[6px] bg-white border border-[#D6EAF8] p-2">
              <span className="text-[10px] font-bold text-[#9a9a9a] uppercase block mb-1">
                {t("ai.solutions")}
              </span>
              <ol className="list-decimal list-inside space-y-1">
                {result.solutions.map((s, i) => (
                  <li key={i} className="text-[12px] text-[#535353]">
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistPanel;
