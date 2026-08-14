import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPlus, faShield, faTrash, faPen, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
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

const FIELD_REFERENCE: { field: string; hint: string }[] = [
  { field: "system", hint: "OS name/version, hostname, boot time" },
  { field: "hardware", hint: "CPU, RAM, disks, serial number" },
  { field: "software", hint: "installed programs" },
  { field: "network", hint: "adapters, IPs, DNS" },
  { field: "security", hint: "bitlocker[], firewall_profile[], antivirus[], tpm, uac_status" },
  { field: "users", hint: "local accounts" },
  { field: "peripherals", hint: "attached devices" },
];

const ComplianceRules = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const formatExpected = (value: any): string => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const startEdit = (rule: ComplianceRule) => {
    setEditingKey(rule.key);
    setDraft({
      key: rule.key,
      name: rule.name,
      description: rule.description ?? "",
      category: rule.category,
      jsonPath: rule.jsonPath,
      operator: rule.operator,
      expected: formatExpected(rule.expected),
      severity: rule.severity,
      enabled: rule.enabled,
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft(emptyDraft());
  };

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
      setEditingKey(null);
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
    onSuccess: (_data, key) => {
      toast.success(t("settings.compliance.deleted"));
      if (editingKey === key) cancelEdit();
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
        <CardHeader
          text={editingKey ? t("settings.compliance.editRule", { key: editingKey }) : t("settings.compliance.define")}
          icon={editingKey ? faPen : faPlus}
        />

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Input
            label={t("settings.compliance.key")}
            value={draft.key}
            handleChange={(v: string) => setDraft({ ...draft, key: v })}
            placeholder={t("settings.compliance.keyPlaceholder")}
            disabled={!!editingKey}
          />
          <Input
            label={t("settings.compliance.name")}
            value={draft.name}
            handleChange={(v: string) => setDraft({ ...draft, name: v })}
            placeholder={t("settings.compliance.namePlaceholder")}
            className="md:col-span-2"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Input
            label={t("settings.compliance.category")}
            value={draft.category}
            handleChange={(v: string) => setDraft({ ...draft, category: v })}
            placeholder={t("settings.compliance.categoryPlaceholder")}
          />
          <SelectSecondary
            label={t("settings.compliance.severity")}
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
          <div className="flex h-[42px] items-center">
            <Checkbox
              id="compliance-enabled"
              checked={draft.enabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, enabled: e.target.checked })
              }
              label={t("settings.compliance.enabled")}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F0F0F0]">
          <h3 className="text-[14px] font-bold text-[#3C3C3C]">
            {t("settings.compliance.condition")}
          </h3>
          <p className="text-[12px] text-[#7a7a7a] mt-1">
            {t("settings.compliance.conditionHelp")}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9a9a9a]">
            {FIELD_REFERENCE.map((f) => (
              <span key={f.field}>
                <code className="text-[#2B9AE9] font-bold">{f.field}</code> — {f.hint}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <Input
              label={t("settings.compliance.jsonPath")}
              value={draft.jsonPath}
              handleChange={(v: string) => setDraft({ ...draft, jsonPath: v })}
              placeholder={t("settings.compliance.jsonPathPlaceholder")}
              className="md:col-span-2"
            />
            <SelectSecondary
              label={t("settings.compliance.operator")}
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
          </div>
          <div className="mt-3">
            <Input
              label={t("settings.compliance.expected")}
              value={draft.expected}
              handleChange={(v: string) => setDraft({ ...draft, expected: v })}
              placeholder={t("settings.compliance.expectedPlaceholder")}
            />
          </div>
        </div>

        <Input
          label={t("settings.compliance.description")}
          value={draft.description}
          handleChange={(v: string) => setDraft({ ...draft, description: v })}
          placeholder={t("settings.compliance.descriptionPlaceholder")}
          className="mt-3"
        />

        <div className="mt-4 flex items-center gap-3">
          <ButtonPrimary
            icon={editingKey ? faCheck : faPlus}
            text={
              createMutation.isPending
                ? t("settings.compliance.saving")
                : editingKey
                  ? t("settings.compliance.updateRule")
                  : t("settings.compliance.saveRule")
            }
            onClick={() => {
              if (!draft.key.trim() || !draft.name.trim() || !draft.jsonPath.trim()) {
                toast.error(t("settings.compliance.requiredFields"));
                return;
              }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          />
          {editingKey && (
            <ButtonPrimary
              color="white"
              icon={faXmark}
              text={t("common.cancel")}
              onClick={cancelEdit}
            />
          )}
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
                    className="inline-flex items-center justify-center w-[78px] shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white text-center"
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
                  <button
                    type="button"
                    onClick={() => startEdit(rule)}
                    className="text-[#2B9AE9] cursor-pointer"
                    title={t("common.edit")}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      askConfirm(
                        () => deleteMutation.mutate(rule.key),
                        rule.builtin
                          ? t("settings.compliance.confirmDeleteBuiltin", { name: rule.name })
                          : t("settings.compliance.confirmDelete", { name: rule.name }),
                      )
                    }
                    className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
                    title={t("common.delete")}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
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
