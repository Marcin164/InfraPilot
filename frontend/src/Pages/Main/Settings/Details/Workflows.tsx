import { useState } from "react";
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

const STEP_DEFS: {
  type: WorkflowStepType;
  label: string;
  icon: any;
  defaultConfig: Record<string, any>;
}[] = [
  {
    type: "request_approval",
    label: "Request approval",
    icon: faCircleCheck,
    defaultConfig: { approverIds: [], message: "" },
  },
  {
    type: "notify",
    label: "Send notification",
    icon: faPaperPlane,
    defaultConfig: { recipientType: "requester", title: "", body: "" },
  },
  {
    type: "set_field",
    label: "Set field",
    icon: faGears,
    defaultConfig: { field: "priority", value: "Medium" },
  },
  {
    type: "assign_to",
    label: "Assign to user",
    icon: faUser,
    defaultConfig: { userId: "" },
  },
  {
    type: "create_comment",
    label: "Auto-comment",
    icon: faCommentDots,
    defaultConfig: { content: "", type: "Worknotes" },
  },
];

const stepDef = (t: WorkflowStepType) => STEP_DEFS.find((d) => d.type === t)!;

const newStep = (type: WorkflowStepType, order: number): WorkflowStep => ({
  id: crypto.randomUUID(),
  order,
  type,
  label: stepDef(type).label,
  config: { ...stepDef(type).defaultConfig },
});

const Workflows = () => {
  const queryClient = useQueryClient();

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
      toast.success("Workflow saved");
      setEditing(saved);
      invalidateAll();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      toast.success("Workflow deleted");
      setEditing(null);
      invalidateAll();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Delete failed"),
  });

  const startNew = () => {
    setEditing({
      id: "",
      name: "New workflow",
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
            <CardHeader text="Workflows" icon={faBolt} />
            <ButtonPrimary icon={faPlus} text="New" onClick={startNew} />
          </div>

          {workflowsQuery.isLoading ? (
            <div className="mt-3 text-[13px] text-[#7a7a7a]">Loading…</div>
          ) : (workflowsQuery.data ?? []).length === 0 ? (
            <div className="mt-3 text-[13px] text-[#7a7a7a]">
              No workflows yet.
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
                      {w.enabled ? "on" : "off"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9a9a9a] mt-0.5">
                    {w.steps?.length ?? 0} step
                    {(w.steps?.length ?? 0) === 1 ? "" : "s"} · trigger:{" "}
                    {w.trigger}
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
              if (window.confirm(`Delete workflow "${editing.name}"?`))
                deleteMutation.mutate(editing.id);
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
              Pick a workflow on the left, or create a new one.
            </div>
          </div>
        )}
      </div>
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
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2B9AE9");
  const [ticketType, setTicketType] = useState<"Incident" | "Service" | "">(
    "",
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const upsertMutation = useMutation({
    mutationFn: (c: Partial<TicketCategory> & { name: string }) =>
      upsertTicketCategory(c),
    onSuccess: () => {
      toast.success("Category saved");
      setName("");
      setColor("#2B9AE9");
      setTicketType("");
      setEditingId(null);
      onChanged();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTicketCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      onChanged();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Delete failed"),
  });

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
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
      <CardHeader text="Categories" icon={faLayerGroup} />
      <p className="text-[12px] text-[#7a7a7a] mt-2">
        Categories organise tickets and can attach a workflow that fires on
        creation.
      </p>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <Input
          className="md:col-span-2 pt-0"
          value={name}
          handleChange={setName}
          placeholder="Category name"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-[44px] rounded-[10px] border border-[#535353] cursor-pointer"
          aria-label="Category color"
        />
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <div className="min-w-[180px]">
          <SelectSecondary
            options={[
              { value: "", label: "Any type" },
              { value: "Incident", label: "Incident" },
              { value: "Service", label: "Service" },
            ]}
            value={
              ticketType
                ? { value: ticketType, label: ticketType }
                : { value: "", label: "Any type" }
            }
            onSelect={(opt: any) => setTicketType((opt?.value ?? "") as any)}
          />
        </div>
        <ButtonPrimary
          icon={editingId ? faCheck : faPlus}
          text={editingId ? "Update" : "Add"}
          onClick={submit}
          disabled={upsertMutation.isPending}
        />
        {editingId && (
          <ButtonPrimary
            color="white"
            text="Cancel"
            onClick={() => {
              setEditingId(null);
              setName("");
              setColor("#2B9AE9");
              setTicketType("");
            }}
          />
        )}
      </div>

      <div className="mt-3 space-y-1">
        {categories.length === 0 && (
          <div className="text-[13px] text-[#7a7a7a]">No categories yet.</div>
        )}
        {categories.map((c) => {
          const wf = workflows.find((w) => w.id === c.workflowId);
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-[6px] border border-[#E8E8E8] px-2 py-1.5"
            >
              <span
                className="w-[10px] h-[10px] rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[#3C3C3C] truncate">
                  {c.name}
                </div>
                <div className="text-[11px] text-[#9a9a9a]">
                  {c.ticketType ?? "any"}
                  {wf && (
                    <>
                      {" · "}
                      <span className="text-[#2B9AE9]">↳ {wf.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="min-w-[160px]">
                <SelectSecondary
                  options={[
                    { value: "", label: "— no workflow —" },
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
                      : { value: "", label: "— no workflow —" }
                  }
                  onSelect={(opt: any) =>
                    upsertTicketCategory({
                      ...c,
                      workflowId: opt?.value || null,
                    }).then(onChanged)
                  }
                />
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
                title="Edit"
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete category "${c.name}"?`))
                    deleteMutation.mutate(c.id);
                }}
                className="text-[#F3606E] cursor-pointer"
                title="Delete"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          );
        })}
      </div>
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
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Name"
            value={workflow.name}
            handleChange={(v: string) => setField("name", v)}
            placeholder="Workflow name"
          />
          <Input
            label="Description"
            value={workflow.description ?? ""}
            handleChange={(v: string) =>
              setField("description", v as TicketWorkflow["description"])
            }
            placeholder="Optional description"
          />
        </div>
        <Checkbox
          id={`workflow-${workflow.id}-enabled`}
          checked={workflow.enabled}
          color="#30A712"
          handleChange={(v: boolean) => setField("enabled", v)}
          label="Enabled"
        />
      </div>

      <div className="flex items-center gap-2 text-[12px] text-[#7a7a7a]">
        <span>Trigger:</span>
        <div className="min-w-[200px]">
          <SelectSecondary
            options={[
              { value: "on_create", label: "On ticket create" },
            ]}
            value={{ value: workflow.trigger, label: "On ticket create" }}
            onSelect={(opt: any) =>
              opt?.value && setField("trigger", opt.value as any)
            }
          />
        </div>
        <span className="text-[10px] text-[#9a9a9a]">
          (more triggers coming)
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <CardHeader text="Steps" icon={faBell} />
          <div className="flex items-center gap-1 flex-wrap">
            {STEP_DEFS.map((d) => (
              <button
                key={d.type}
                type="button"
                onClick={() => addStep(d.type)}
                className="rounded-[6px] border border-[#D0D0D0] px-2 py-1 text-[11px] hover:bg-[#F5F5F5] cursor-pointer"
                title={d.label}
              >
                <FontAwesomeIcon icon={d.icon} className="mr-1" />
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {workflow.steps.length === 0 ? (
          <div className="text-[13px] text-[#7a7a7a] border border-dashed border-[#D0D0D0] rounded-[6px] p-3 text-center">
            Add a step using the buttons above. Steps run in order.
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
                    className="text-[#2B9AE9]"
                  />
                  <span className="font-bold text-[13px]">
                    {stepDef(step.type).label}
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
          text={saving ? "Saving…" : workflow.id ? "Save changes" : "Create"}
          onClick={() => onSave(workflow)}
          disabled={saving || !workflow.name.trim()}
        />
        <ButtonPrimary
          icon={faTrash}
          text={workflow.id ? "Delete workflow" : "Discard"}
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
  const setCfg = (k: string, v: any) =>
    onChange({ config: { ...step.config, [k]: v } });

  switch (step.type) {
    case "request_approval":
      return (
        <div className="mt-2 grid grid-cols-1 gap-2">
          <Input
            label="Approver IDs (comma-separated)"
            value={(step.config.approverIds ?? []).join(",")}
            handleChange={(v: string) =>
              setCfg(
                "approverIds",
                v.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
            placeholder="user-id-1, user-id-2"
          />
          <Input
            label="Message (optional)"
            value={step.config.message ?? ""}
            handleChange={(v: string) => setCfg("message", v)}
          />
        </div>
      );

    case "notify":
      return (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <SelectField
            label="Recipient"
            value={step.config.recipientType ?? "requester"}
            options={[
              { value: "requester", label: "Ticket requester" },
              { value: "assignee", label: "Ticket assignee" },
              { value: "specific", label: "Specific users" },
            ]}
            onChange={(v) => setCfg("recipientType", v)}
          />
          {step.config.recipientType === "specific" && (
            <Input
              label="User IDs (comma-separated)"
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
            label="Title"
            value={step.config.title ?? ""}
            handleChange={(v: string) => setCfg("title", v)}
          />
          <Input
            label="Body"
            value={step.config.body ?? ""}
            handleChange={(v: string) => setCfg("body", v)}
          />
        </div>
      );

    case "set_field":
      return (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SelectField
            label="Field"
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
            label="Value"
            value={step.config.value ?? ""}
            handleChange={(v: string) => setCfg("value", v)}
          />
        </div>
      );

    case "assign_to":
      return (
        <div className="mt-2">
          <Input
            label="User ID"
            value={step.config.userId ?? ""}
            handleChange={(v: string) => setCfg("userId", v)}
            placeholder="paste user UUID"
          />
        </div>
      );

    case "create_comment":
      return (
        <div className="mt-2 grid grid-cols-1 gap-2">
          <SelectField
            label="Comment type"
            value={step.config.type ?? "Worknotes"}
            options={[
              { value: "Worknotes", label: "Internal worknote" },
              { value: "Public", label: "Public comment" },
            ]}
            onChange={(v) => setCfg("type", v)}
          />
          <div className="pt-2">
            <label className="font-bold text-[#3C3C3C]">Content</label>
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
