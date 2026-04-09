import { useForm, useStore } from "@tanstack/react-form";
import { useMemo } from "react";
import { updateTicketDefaultValues } from "../../Constants/defaultValues";
import SelectSecondary from "../Inputs/SelectSecondary";
import {
  ticketImpactOptions,
  ticketPriorityOptions,
  ticketStateOptions,
  ticketUrgencyOptions,
} from "../../Constants/options";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  const mutation = useMutation({
    mutationFn: async (values: UpdateTicketData) => {
      return updateTicket(id, values);
    },

    onSuccess: () => {
      toast.success("Ticket updated!");
    },
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

  const selectedGroup = useStore(
    form.store,
    (s: any) => s.values.assignmentGroup as string,
  );
  const selectedAssignee = useStore(
    form.store,
    (s: any) => s.values.assignee as string,
  );

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
        value: `${m.name} ${m.surname}`,
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
            label="Assignee"
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
            label="State"
            options={ticketStateOptions}
            value={ticketStateOptions.find((option) => option.value === state)}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="priority"
        children={(field) => (
          <SelectSecondary
            label="Priority"
            options={ticketPriorityOptions}
            value={ticketPriorityOptions.find(
              (option) => option.value === priority
            )}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="impact"
        children={(field) => (
          <SelectSecondary
            label="Impact"
            options={ticketImpactOptions}
            value={ticketImpactOptions.find(
              (option) => option.value === impact
            )}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="urgency"
        children={(field) => (
          <SelectSecondary
            label="Urgency"
            options={ticketUrgencyOptions}
            value={ticketUrgencyOptions.find(
              (option) => option.value === urgency
            )}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <ButtonPrimary
        className="mt-4"
        icon={faPen}
        text="Update"
        type="submit"
      />
    </form>
  );
};

export default UpdateTicketForm;
