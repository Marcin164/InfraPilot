import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { updateTicketDefaultValues } from "../../Constants/defaultValues";
import SelectSecondary from "../Inputs/SelectSecondary";
import {
  ticketImpactOptions,
  ticketPriorityOptions,
  ticketStateOptions,
  ticketUrgencyOptions,
} from "../../Constants/options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateTicket } from "../../Services/tickets";
import {
  getAssignmentGroups,
  getAssignmentGroupMembers,
} from "../../Services/assignmentGroups";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import type {
  TicketState,
  TicketPriority,
  TicketImpact,
  TicketUrgency,
  UpdateTicketData,
} from "../../Types";

type Props = {
  id: string;
  state: TicketState;
  assignee?: string;
  assignmentGroup?: string;
  priority: TicketPriority;
  impact: TicketImpact;
  urgency: TicketUrgency;
};

const UpdateTicketForm = ({
  id,
  state,
  assignee,
  assignmentGroup,
  priority,
  impact,
  urgency,
}: Props) => {
  const { t } = useTranslation();
  const trOpts = useMemo(
    () => ({
      states: ticketStateOptions.map((o) => ({ ...o, label: t(o.label) })),
      priorities: ticketPriorityOptions.map((o) => ({ ...o, label: t(o.label) })),
      impacts: ticketImpactOptions.map((o) => ({ ...o, label: t(o.label) })),
      urgencies: ticketUrgencyOptions.map((o) => ({ ...o, label: t(o.label) })),
    }),
    [t],
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: UpdateTicketData) => updateTicket(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["helpdesk"] });
      toast.success(t("toast.success.ticketUpdated"));
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("toast.error.ticketUpdate")),
  });

  const form = useForm({
    defaultValues: {
      ...updateTicketDefaultValues(state, priority, impact, urgency),
      assignee: assignee ?? "",
      assignmentGroup: assignmentGroup ?? "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  // @tanstack/react-form only re-syncs a field from `defaultValues` while the
  // form is untouched -- select an option once (e.g. change State) and the
  // whole form is marked touched forever, so it stops picking up fresh
  // server values after that (e.g. a workflow silently bumping priority on
  // save). Sync explicitly instead of relying on that.
  useEffect(() => {
    form.setFieldValue("state", state);
    form.setFieldValue("priority", priority);
    form.setFieldValue("impact", impact);
    form.setFieldValue("urgency", urgency);
    form.setFieldValue("assignee", assignee ?? "");
    form.setFieldValue("assignmentGroup", assignmentGroup ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, priority, impact, urgency, assignee, assignmentGroup]);

  const selectedGroup = useStore(
    form.store,
    (s: any) => s.values.assignmentGroup as string,
  );
  const selectedAssignee = useStore(
    form.store,
    (s: any) => s.values.assignee as string,
  );
  const selectedState = useStore(form.store, (s: any) => s.values.state as string);
  const selectedPriority = useStore(form.store, (s: any) => s.values.priority as string);
  const selectedImpact = useStore(form.store, (s: any) => s.values.impact as string);
  const selectedUrgency = useStore(form.store, (s: any) => s.values.urgency as string);

  const groupsQuery = useQuery({
    queryKey: ["assignment-groups"],
    queryFn: getAssignmentGroups,
  });

  const membersQuery = useQuery({
    queryKey: ["assignment-group-members", selectedGroup],
    queryFn: () => getAssignmentGroupMembers(selectedGroup),
    enabled: Boolean(selectedGroup),
  });

  const groupOptions = useMemo(
    () =>
      (groupsQuery.data ?? []).map((g) => ({
        value: g.name,
        label: g.name,
      })),
    [groupsQuery.data],
  );

  const assigneeOptions = useMemo(
    () =>
      (membersQuery.data ?? []).map((m) => ({
        value: m.id,
        label: `${m.name} ${m.surname}${m.email ? ` (${m.email})` : ""}`,
      })),
    [membersQuery.data],
  );

  const handleSelect = (opt: any, field: any) => {
    field.handleChange(opt?.value ?? "");
  };

  const handleGroupSelect = (opt: any, field: any) => {
    const newGroup = opt?.value ?? "";
    field.handleChange(newGroup);
    // Reset assignee when group changes — the previous assignee may not belong to the new group
    form.setFieldValue("assignee", "");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="assignmentGroup"
        children={(field) => (
          <SelectSecondary
            label="Assignment Group"
            options={groupOptions}
            value={
              groupOptions.find((o) => o.value === selectedGroup) ?? null
            }
            onSelect={(opt: any) => handleGroupSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="assignee"
        children={(field) => (
          <SelectSecondary
            label={t("form.field.assignee", "Assignee")}
            options={assigneeOptions}
            value={
              assigneeOptions.find((o) => o.value === selectedAssignee) ?? null
            }
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="state"
        children={(field) => (
          <SelectSecondary
            label={t("device.state")}
            options={trOpts.states}
            value={trOpts.states.find((option) => option.value === selectedState)}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="priority"
        children={(field) => (
          <SelectSecondary
            label={t("form.priority")}
            options={trOpts.priorities}
            value={trOpts.priorities.find(
              (option) => option.value === selectedPriority
            )}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="impact"
        children={(field) => (
          <SelectSecondary
            label={t("form.field.impact", "Impact")}
            options={trOpts.impacts}
            value={trOpts.impacts.find(
              (option) => option.value === selectedImpact
            )}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="urgency"
        children={(field) => (
          <SelectSecondary
            label={t("form.field.urgency", "Urgency")}
            options={trOpts.urgencies}
            value={trOpts.urgencies.find(
              (option) => option.value === selectedUrgency
            )}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <ButtonPrimary
        className="mt-4"
        icon={faPen}
        text={t("common.update")}
        type="submit"
      />
    </form>
  );
};

export default UpdateTicketForm;
