import { useState } from "react";
import ColorPicker from "../../../../Components/Inputs/ColorPicker";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  faArrowDown,
  faArrowUp,
  faBell,
  faBolt,
  faCheck,
  faCircleCheck,
  faCommentDots,
  faGears,
  faLayerGroup,
  faPaperPlane,
  faPen,
  faPlus,
  faTrash,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import {
  TicketCategory,
  TicketWorkflow,
  WorkflowStep,
  WorkflowStepType,
  listTicketCategories,
  upsertTicketCategory,
  deleteTicketCategory,
  listWorkflows,
  upsertWorkflow,
  deleteWorkflow,
} from "../../../../Services/ticketWorkflows";

const TRIGGER_OPTIONS: { value: TicketWorkflow["trigger"]; labelKey: string }[] = [
  { value: "on_create", labelKey: "settings.workflow.editor.triggerCreate" },
  { value: "on_state_change", labelKey: "settings.workflow.editor.triggerStateChange" },
  { value: "on_assign", labelKey: "settings.workflow.editor.triggerAssign" },
  { value: "on_priority_change", labelKey: "settings.workflow.editor.triggerPriorityChange" },
  { value: "on_close", labelKey: "settings.workflow.editor.triggerClose" },
];

const STEP_DEFS: {
  type: WorkflowStepType;
  labelKey: string;
  icon: any;
  color: string;
  defaultConfig: Record<string, any>;
}[] = [
  {
    type: "request_approval",
    labelKey: "settings.workflow.step.request_approval",
    icon: faCircleCheck,
    color: "#30A712",
    defaultConfig: { approverIds: [], message: "" },
  },
  {
    type: "notify",
    labelKey: "settings.workflow.step.notify",
    icon: faPaperPlane,
    color: "#2B9AE9",
    defaultConfig: { recipientType: "requester", title: "", body: "" },
  },
  {
    type: "set_field",
    labelKey: "settings.workflow.step.set_field",
    icon: faGears,
    color: "#9B59B6",
    defaultConfig: { field: "priority", value: "Medium" },
  },
  {
    type: "assign_to",
    labelKey: "settings.workflow.step.assign_to",
    icon: faUser,
    color: "#FF6B35",
    defaultConfig: { userId: "" },
  },
  {
    type: "create_comment",
    labelKey: "settings.workflow.step.create_comment",
    icon: faCommentDots,
    color: "#6B7280",
    defaultConfig: { content: "", type: "Worknotes" },
  },
];

const stepDef = (t: WorkflowStepType) => STEP_DEFS.find((d) => d.type === t)!;

const newStep = (type: WorkflowStepType, order: number): WorkflowStep => ({
  id: crypto.randomUUID(),
  order,
  type,
  label: stepDef(type).labelKey,
  config: { ...stepDef(type).defaultConfig },
});

const Workflows = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const workflowsQuery = useQuery({
    queryKey: ["ticket-workflows"],
    queryFn: listWorkflows,
  });

  const categoriesQuery = useQuery({
    queryKey: ["ticket-categories"],
    queryFn: listTicketCategories,
  });

  const [editing, setEditing] = useState<TicketWorkflow | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["ticket-workflows"] });
    queryClient.invalidateQueries({ queryKey: ["ticket-categories"] });
  };

  const saveMutation = useMutation({
    mutationFn: (w: TicketWorkflow) => upsertWorkflow(w),
    onSuccess: (saved) => {
      toast.success(t("settings.workflow.saved"));
      setEditing(saved);
      invalidateAll();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.workflow.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      toast.success(t("settings.workflow.deleted"));
      setEditing(null);
      invalidateAll();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.workflow.deleteFailed")),
  });

  const startNew = () => {
    setEditing({
      id: "",
      name: t("settings.workflow.newName"),
      description: "",
      trigger: "on_create",
      enabled: true,
      steps: [],
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="m-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <CategoriesPanel
          categories={categoriesQuery.data ?? []}
          workflows={workflowsQuery.data ?? []}
          onChanged={invalidateAll}
        />

        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <div className="flex items-center justify-between">
            <CardHeader text={t("settings.workflow.title")} icon={faBolt} />
            <ButtonPrimary icon={faPlus} text={t("settings.workflow.new")} onClick={startNew} />
          </div>

          {workflowsQuery.isLoading ? (
            <div className="mt-3 text-[13px] text-[#7a7a7a]">{t("settings.workflow.loading")}</div>
          ) : (workflowsQuery.data ?? []).length === 0 ? (
            <div className="mt-3 text-[13px] text-[#7a7a7a]">
              {t("settings.workflow.empty")}
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              {(workflowsQuery.data ?? []).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setEditing(w)}
                  className={`w-full text-left rounded-[6px] px-3 py-2 cursor-pointer ${
                    editing?.id === w.id
                      ? "bg-[#E8F4FD] border border-[#2B9AE9]"
                      : "hover:bg-[#F5F5F5]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[13px] text-[#3C3C3C]">
                      {w.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                        w.enabled
                          ? "bg-[#DFF0D8] text-[#30A712]"
                          : "bg-[#F0F0F0] text-[#9a9a9a]"
                      }`}
                    >
                      {w.enabled ? t("settings.workflow.on") : t("settings.workflow.off")}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9a9a9a] mt-0.5">
                    {t("settings.workflow.stepsTrigger", { steps: w.steps?.length ?? 0, trigger: w.trigger })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {editing ? (
          <WorkflowEditor
            workflow={editing}
            onChange={setEditing}
            onSave={(w) => saveMutation.mutate(w)}
            onDelete={() => {
              if (!editing.id) {
                setEditing(null);
                return;
              }
              askConfirm(() => deleteMutation.mutate(editing.id), t("settings.workflow.confirmDelete", { name: editing.name }));
            }}
            saving={saveMutation.isPending}
          />
        ) : (
          <div className="bg-white shadow-xl rounded-[10px] p-6 text-center">
            <FontAwesomeIcon
              icon={faBolt}
              className="text-[#9a9a9a] text-[32px]"
            />
            <div className="mt-2 text-[13px] text-[#7a7a7a]">
              {t("settings.workflow.pickHint")}
            </div>
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

// ───────────────────────── Categories ─────────────────────────

const CategoriesPanel = ({
  categories,
  workflows,
  onChanged,
}: {
  categories: TicketCategory[];
  workflows: TicketWorkflow[];
  onChanged: () => void;
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2B9AE9");
  const [ticketType, setTicketType] = useState<"Incident" | "Service" | "">(
    "",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const upsertMutation = useMutation({
    mutationFn: (c: Partial<TicketCategory> & { name: string }) =>
      upsertTicketCategory(c),
    onSuccess: () => {
      toast.success(t("settings.workflow.categories.saved"));
      setName("");
      setColor("#2B9AE9");
      setTicketType("");
      setEditingId(null);
      onChanged();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.workflow.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTicketCategory(id),
    onSuccess: () => {
      toast.success(t("settings.workflow.categories.deleted"));
      onChanged();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.workflow.deleteFailed")),
  });

  const submit = () => {
    if (!name.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    upsertMutation.mutate({
      id: editingId ?? undefined,
      name: name.trim(),
      color,
      ticketType: ticketType || null,
      enabled: true,
    });
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("settings.workflow.categories")} icon={faLayerGroup} />
      <p className="text-[12px] text-[#7a7a7a] mt-2">
        {t("settings.workflow.categories.help")}
      </p>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <Input
          className="md:col-span-2 pt-0"
          value={name}
          handleChange={setName}
          placeholder={t("settings.workflow.categories.namePlaceholder")}
        />
        <div className="flex items-end pb-[5px]">
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <div className="min-w-[180px]">
          <SelectSecondary
            options={[
              { value: "", label: t("settings.workflow.categories.anyType") },
              { value: "Incident", label: t("form.ticketType.incident") },
              { value: "Service", label: t("form.ticketType.service") },
            ]}
            value={
              ticketType
                ? {
                    value: ticketType,
                    label:
                      ticketType === "Incident"
                        ? t("form.ticketType.incident")
                        : t("form.ticketType.service"),
                  }
                : { value: "", label: t("settings.workflow.categories.anyType") }
            }
            onSelect={(opt: any) => setTicketType((opt?.value ?? "") as any)}
          />
        </div>
        <ButtonPrimary
          icon={editingId ? faCheck : faPlus}
          text={editingId ? t("settings.workflow.categories.update") : t("settings.workflow.categories.add")}
          onClick={submit}
          disabled={upsertMutation.isPending}
        />
        {editingId && (
          <ButtonPrimary
            color="white"
            text={t("common.cancel")}
            onClick={() => {
              setEditingId(null);
              setName("");
              setColor("#2B9AE9");
              setTicketType("");
            }}
          />
        )}
      </div>

      <div className="mt-3 space-y-1 max-h-[320px] overflow-y-auto pr-1">
        {categories.length === 0 && (
          <div className="text-[13px] text-[#7a7a7a]">{t("settings.workflow.categories.empty")}</div>
        )}
        {categories.map((c) => {
          const wf = workflows.find((w) => w.id === c.workflowId);
          return (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-[6px] border border-[#E8E8E8] px-2 py-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="w-[10px] h-[10px] rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[#3C3C3C] truncate">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-[#9a9a9a]">
                    {c.ticketType ?? t("settings.workflow.categories.any")}
                    {wf && (
                      <>
                        {" · "}
                        <span className="text-[#2B9AE9]">↳ {wf.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c.id);
                    setName(c.name);
                    setColor(c.color);
                    setTicketType(c.ticketType ?? "");
                  }}
                  className="text-[#2B9AE9] cursor-pointer"
                  title={t("common.edit")}
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  type="button"
                  onClick={() => askConfirm(() => deleteMutation.mutate(c.id), t("settings.workflow.categories.confirmDelete", { name: c.name }))}
                  className="text-[#F3606E] cursor-pointer"
                  title={t("common.delete")}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[160px]">
                <SelectSecondary
                  options={[
                    { value: "", label: t("settings.workflow.categories.noWorkflow") },
                    ...workflows.map((w) => ({ value: w.id, label: w.name })),
                  ]}
                  value={
                    c.workflowId
                      ? {
                          value: c.workflowId,
                          label:
                            workflows.find((w) => w.id === c.workflowId)?.name ??
                            "—",
                        }
                      : { value: "", label: t("settings.workflow.categories.noWorkflow") }
                  }
                  onSelect={(opt: any) =>
                    upsertTicketCategory({
                      ...c,
                      workflowId: opt?.value || null,
                    }).then(onChanged)
                  }
                />
              </div>
            </div>
          );
        })}
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

// ───────────────────────── Editor ─────────────────────────

const WorkflowEditor = ({
  workflow,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  workflow: TicketWorkflow;
  onChange: (w: TicketWorkflow) => void;
  onSave: (w: TicketWorkflow) => void;
  onDelete: () => void;
  saving: boolean;
}) => {
  const { t } = useTranslation();
  const setField = <K extends keyof TicketWorkflow>(
    key: K,
    value: TicketWorkflow[K],
  ) => onChange({ ...workflow, [key]: value });

  const setStep = (idx: number, patch: Partial<WorkflowStep>) => {
    const next = workflow.steps.map((s, i) =>
      i === idx ? { ...s, ...patch } : s,
    );
    onChange({ ...workflow, steps: next });
  };

  const addStep = (type: WorkflowStepType) => {
    onChange({
      ...workflow,
      steps: [...workflow.steps, newStep(type, workflow.steps.length)],
    });
  };

  const removeStep = (idx: number) => {
    const next = workflow.steps
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, order: i }));
    onChange({ ...workflow, steps: next });
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= workflow.steps.length) return;
    const next = [...workflow.steps];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange({
      ...workflow,
      steps: next.map((s, i) => ({ ...s, order: i })),
    });
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label={t("settings.workflow.editor.name")}
            value={workflow.name}
            handleChange={(v: string) => setField("name", v)}
            placeholder={t("settings.workflow.editor.namePlaceholder")}
          />
          <Input
            label={t("settings.workflow.editor.description")}
            value={workflow.description ?? ""}
            handleChange={(v: string) =>
              setField("description", v as TicketWorkflow["description"])
            }
            placeholder={t("settings.workflow.editor.descriptionPlaceholder")}
          />
        </div>
        <Checkbox
          id={`workflow-${workflow.id}-enabled`}
          checked={workflow.enabled}
          color="#30A712"
          handleChange={(v: boolean) => setField("enabled", v)}
          label={t("settings.workflow.editor.enabled")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#7a7a7a]">
        <span>{t("settings.workflow.editor.trigger")}</span>
        <div className="min-w-[240px]">
          <SelectSecondary
            options={TRIGGER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            value={{ value: workflow.trigger, label: t(TRIGGER_OPTIONS.find((o) => o.value === workflow.trigger)?.labelKey ?? TRIGGER_OPTIONS[0].labelKey) }}
            onSelect={(opt: any) =>
              opt?.value && setField("trigger", opt.value as any)
            }
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <CardHeader text={t("settings.workflow.editor.steps")} icon={faBell} />
          <div className="flex items-center gap-1 flex-wrap">
            {STEP_DEFS.map((d) => (
              <button
                key={d.type}
                type="button"
                onClick={() => addStep(d.type)}
                className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ backgroundColor: d.color + "20", color: d.color, border: `1px solid ${d.color}50` }}
                title={t(d.labelKey)}
              >
                <FontAwesomeIcon icon={d.icon} className="text-[11px]" />
                {t(d.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {workflow.steps.length === 0 ? (
          <div className="text-[13px] text-[#7a7a7a] border border-dashed border-[#D0D0D0] rounded-[6px] p-3 text-center">
            {t("settings.workflow.editor.stepsHint")}
          </div>
        ) : (
          <ol className="space-y-2 relative">
            {workflow.steps.map((step, i) => (
              <li
                key={step.id}
                className="rounded-[8px] border border-[#E0E0E0] p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-[20px] h-[20px] rounded-full bg-[#2B9AE9] text-white text-[11px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <FontAwesomeIcon
                    icon={stepDef(step.type).icon}
                    style={{ color: stepDef(step.type).color }}
                  />
                  <span className="font-bold text-[13px]">
                    {t(stepDef(step.type).labelKey)}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      className="text-[#7a7a7a] disabled:opacity-30 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(i, 1)}
                      disabled={i === workflow.steps.length - 1}
                      className="text-[#7a7a7a] disabled:opacity-30 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-[#F3606E] cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                <StepConfig step={step} onChange={(p) => setStep(i, p)} />
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[#F0F0F0]">
        <ButtonPrimary
          icon={faCheck}
          text={saving ? t("settings.workflow.editor.saving") : workflow.id ? t("settings.workflow.editor.saveChanges") : t("settings.workflow.editor.create")}
          onClick={() => onSave(workflow)}
          disabled={saving || !workflow.name.trim()}
        />
        <ButtonPrimary
          icon={faTrash}
          text={workflow.id ? t("settings.workflow.editor.delete") : t("settings.workflow.editor.discard")}
          color="red"
          onClick={onDelete}
          className="ml-auto"
        />
      </div>
    </div>
  );
};

// ───────────────────────── Step config form ─────────────────────────

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: any;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) => (
  <SelectSecondary
    label={label}
    options={options}
    value={options.find((o) => o.value === value) ?? options[0]}
    onSelect={(opt: any) => opt?.value && onChange(opt.value)}
  />
);

const StepConfig = ({
  step,
  onChange,
}: {
  step: WorkflowStep;
  onChange: (patch: Partial<WorkflowStep>) => void;
}) => {
  const { t } = useTranslation();
  const setCfg = (k: string, v: any) =>
    onChange({ config: { ...step.config, [k]: v } });

  switch (step.type) {
    case "request_approval":
      return (
        <div className="mt-2 grid grid-cols-1 gap-2">
          <Input
            label={t("settings.workflow.config.approverIds")}
            value={(step.config.approverIds ?? []).join(",")}
            handleChange={(v: string) =>
              setCfg(
                "approverIds",
                v.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
            placeholder={t("settings.workflow.config.approverIdsPh")}
          />
          <Input
            label={t("settings.workflow.config.message")}
            value={step.config.message ?? ""}
            handleChange={(v: string) => setCfg("message", v)}
          />
        </div>
      );

    case "notify":
      return (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <SelectField
            label={t("settings.workflow.config.recipient")}
            value={step.config.recipientType ?? "requester"}
            options={[
              { value: "requester", label: t("settings.workflow.config.recipient.requester") },
              { value: "assignee", label: t("settings.workflow.config.recipient.assignee") },
              { value: "specific", label: t("settings.workflow.config.recipient.specific") },
            ]}
            onChange={(v) => setCfg("recipientType", v)}
          />
          {step.config.recipientType === "specific" && (
            <Input
              label={t("settings.workflow.config.recipientIds")}
              value={(step.config.recipientIds ?? []).join(",")}
              handleChange={(v: string) =>
                setCfg(
                  "recipientIds",
                  v.split(",").map((s) => s.trim()).filter(Boolean),
                )
              }
            />
          )}
          <Input
            label={t("settings.workflow.config.title")}
            value={step.config.title ?? ""}
            handleChange={(v: string) => setCfg("title", v)}
          />
          <Input
            label={t("settings.workflow.config.body")}
            value={step.config.body ?? ""}
            handleChange={(v: string) => setCfg("body", v)}
          />
        </div>
      );

    case "set_field":
      return (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectField
            label={t("settings.workflow.config.field")}
            value={step.config.field ?? "priority"}
            options={[
              { value: "priority", label: "priority" },
              { value: "urgency", label: "urgency" },
              { value: "impact", label: "impact" },
              { value: "assignmentGroup", label: "assignmentGroup" },
            ]}
            onChange={(v) => setCfg("field", v)}
          />
          <Input
            label={t("settings.workflow.config.value")}
            value={step.config.value ?? ""}
            handleChange={(v: string) => setCfg("value", v)}
          />
        </div>
      );

    case "assign_to":
      return (
        <div className="mt-2">
          <Input
            label={t("settings.workflow.config.userId")}
            value={step.config.userId ?? ""}
            handleChange={(v: string) => setCfg("userId", v)}
            placeholder={t("settings.workflow.config.userIdPh")}
          />
        </div>
      );

    case "create_comment":
      return (
        <div className="mt-2 grid grid-cols-1 gap-2">
          <SelectField
            label={t("settings.workflow.config.commentType")}
            value={step.config.type ?? "Worknotes"}
            options={[
              { value: "Worknotes", label: t("settings.workflow.config.commentType.worknotes") },
              { value: "Public", label: t("settings.workflow.config.commentType.public") },
            ]}
            onChange={(v) => setCfg("type", v)}
          />
          <div className="pt-2">
            <label className="font-bold text-[#3C3C3C]">{t("settings.workflow.config.content")}</label>
            <textarea
              rows={2}
              className="w-full mt-[6px] rounded-[10px] border border-[#535353] bg-white px-3 py-2 text-[16px] font-bold"
              value={step.config.content ?? ""}
              onChange={(e) => setCfg("content", e.target.value)}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default Workflows;
