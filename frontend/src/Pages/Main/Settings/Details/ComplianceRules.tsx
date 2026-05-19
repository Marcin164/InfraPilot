import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPlus, faShield, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import {
  listComplianceRules,
  upsertComplianceRule,
  deleteComplianceRule,
  ComplianceOperator,
  ComplianceRule,
  ComplianceSeverity,
} from "../../../../Services/compliance";

const OPERATORS: ComplianceOperator[] = [
  "eq",
  "ne",
  "gte",
  "lte",
  "exists",
  "notExists",
  "contains",
  "notContains",
];

const SEVERITIES: ComplianceSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#C0392B",
  HIGH: "#F3606E",
  MEDIUM: "#F1C40F",
  LOW: "#2B9AE9",
};

const emptyDraft = () => ({
  key: "",
  name: "",
  description: "",
  category: "security",
  jsonPath: "",
  operator: "eq" as ComplianceOperator,
  expected: "",
  severity: "MEDIUM" as ComplianceSeverity,
  enabled: true,
});

const ComplianceRules = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft());

  const rulesQuery = useQuery({
    queryKey: ["compliance-rules"],
    queryFn: listComplianceRules,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["compliance-rules"] });

  const parseExpected = (value: string): any => {
    if (value === "") return null;
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value))) return Number(value);
    return value;
  };

  const createMutation = useMutation({
    mutationFn: () =>
      upsertComplianceRule(draft.key.trim(), {
        key: draft.key.trim(),
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        category: draft.category.trim() || "security",
        jsonPath: draft.jsonPath.trim(),
        operator: draft.operator,
        expected: parseExpected(draft.expected),
        severity: draft.severity,
        enabled: draft.enabled,
      }),
    onSuccess: () => {
      toast.success(t("settings.compliance.saved"));
      setDraft(emptyDraft());
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.compliance.saveFailed")),
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: ComplianceRule) =>
      upsertComplianceRule(rule.key, { enabled: !rule.enabled }),
    onSuccess: () => invalidate(),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.compliance.toggleFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteComplianceRule(key),
    onSuccess: () => {
      toast.success(t("settings.compliance.deleted"));
      invalidate();
    },
    onError: (err: any) =>
      toast.error(
        err?.response?.data?.message ?? t("settings.compliance.deleteFailed"),
      ),
  });

  const rules = rulesQuery.data ?? [];

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.compliance.define")} icon={faPlus} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          {t("settings.compliance.help")}{" "}
          <code>security.bitlocker.enabled</code>.
        </p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
            placeholder={t("settings.compliance.keyPlaceholder")}
            className="h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder={t("settings.compliance.namePlaceholder")}
            className="md:col-span-2 h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <input
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value })
            }
            placeholder={t("settings.compliance.categoryPlaceholder")}
            className="h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <SelectSecondary
            options={SEVERITIES.map((s) => ({ value: s, label: s }))}
            value={{ value: draft.severity, label: draft.severity }}
            onSelect={(opt: any) =>
              opt?.value &&
              setDraft({
                ...draft,
                severity: opt.value as ComplianceSeverity,
              })
            }
          />
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) =>
                setDraft({ ...draft, enabled: e.target.checked })
              }
            />
            {t("settings.compliance.enabled")}
          </label>
          <input
            value={draft.jsonPath}
            onChange={(e) =>
              setDraft({ ...draft, jsonPath: e.target.value })
            }
            placeholder={t("settings.compliance.jsonPathPlaceholder")}
            className="md:col-span-2 h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <SelectSecondary
            options={OPERATORS.map((o) => ({ value: o, label: o }))}
            value={{ value: draft.operator, label: draft.operator }}
            onSelect={(opt: any) =>
              opt?.value &&
              setDraft({
                ...draft,
                operator: opt.value as ComplianceOperator,
              })
            }
          />
          <input
            value={draft.expected}
            onChange={(e) =>
              setDraft({ ...draft, expected: e.target.value })
            }
            placeholder={t("settings.compliance.expectedPlaceholder")}
            className="md:col-span-2 h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <input
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder={t("settings.compliance.descriptionPlaceholder")}
            className="md:col-span-3 h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
        </div>
        <div className="mt-3">
          <ButtonPrimary
            icon={faPlus}
            text={createMutation.isPending ? t("settings.compliance.saving") : t("settings.compliance.saveRule")}
            onClick={() => {
              if (!draft.key.trim() || !draft.name.trim() || !draft.jsonPath.trim()) {
                toast.error(t("settings.compliance.requiredFields"));
                return;
              }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          />
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.compliance.title")} icon={faShield} />
        {rules.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">{t("settings.compliance.empty")}</div>
        ) : (
          <div className="mt-3 space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.key}
                className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 rounded-[8px] border px-3 py-2 ${
                  rule.enabled
                    ? "border-[#E0E0E0]"
                    : "border-[#E0E0E0] bg-[#FAFAFA] opacity-70"
                }`}
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white shrink-0"
                    style={{ backgroundColor: SEVERITY_COLOR[rule.severity] }}
                  >
                    {rule.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[13px] text-[#3C3C3C]">
                        {rule.name}
                      </span>
                      {rule.builtin && (
                        <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#E5F1FB] text-[#2B9AE9]">
                          {t("settings.compliance.builtin")}
                        </span>
                      )}
                      <span className="text-[11px] text-[#9a9a9a]">
                        {rule.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9a9a9a] mt-0.5">
                      <code>{rule.jsonPath}</code> {rule.operator}{" "}
                      {rule.expected !== null && rule.expected !== undefined ? (
                        <code>{JSON.stringify(rule.expected)}</code>
                      ) : (
                        "—"
                      )}
                    </div>
                    {rule.description && (
                      <div className="text-[12px] text-[#535353] mt-0.5">
                        {rule.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(rule)}
                    className="text-[12px] text-[#2B9AE9] hover:underline cursor-pointer"
                  >
                    {rule.enabled ? t("settings.compliance.disable") : t("settings.compliance.enable")}
                  </button>
                  {!rule.builtin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t("settings.compliance.confirmDelete", { name: rule.name })))
                          deleteMutation.mutate(rule.key);
                      }}
                      className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
                      title={t("common.delete")}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceRules;
