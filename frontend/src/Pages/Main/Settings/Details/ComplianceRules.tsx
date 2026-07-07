import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPlus, faShield, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
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
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

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
          <Input
            value={draft.key}
            handleChange={(v: string) => setDraft({ ...draft, key: v })}
            placeholder={t("settings.compliance.keyPlaceholder")}
          />
          <Input
            value={draft.name}
            handleChange={(v: string) => setDraft({ ...draft, name: v })}
            placeholder={t("settings.compliance.namePlaceholder")}
            className="md:col-span-2"
          />
          <Input
            value={draft.category}
            handleChange={(v: string) => setDraft({ ...draft, category: v })}
            placeholder={t("settings.compliance.categoryPlaceholder")}
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
          <Checkbox
            id="compliance-enabled"
            checked={draft.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraft({ ...draft, enabled: e.target.checked })
            }
            label={t("settings.compliance.enabled")}
          />
          <Input
            value={draft.jsonPath}
            handleChange={(v: string) => setDraft({ ...draft, jsonPath: v })}
            placeholder={t("settings.compliance.jsonPathPlaceholder")}
            className="md:col-span-2"
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
          <Input
            value={draft.expected}
            handleChange={(v: string) => setDraft({ ...draft, expected: v })}
            placeholder={t("settings.compliance.expectedPlaceholder")}
            className="md:col-span-2"
          />
          <Input
            value={draft.description}
            handleChange={(v: string) => setDraft({ ...draft, description: v })}
            placeholder={t("settings.compliance.descriptionPlaceholder")}
            className="md:col-span-3"
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
                      onClick={() => askConfirm(() => deleteMutation.mutate(rule.key), t("settings.compliance.confirmDelete", { name: rule.name }))}
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
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
      />
    </div>
  );
};

export default ComplianceRules;
