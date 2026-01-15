import { useForm } from "@tanstack/react-form";
import React from "react";
import { updateTicketDefaultValues } from "../../Constants/defaultValues";
import SelectSecondary from "../Inputs/SelectSecondary";
import {
  ticketImpactOptions,
  ticketPriorityOptions,
  ticketStateOptions,
  ticketUrgencyOptions,
} from "../../Constants/options";
import { useMutation } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { updateTicket } from "../../Services/tickets";
import ButtonSecondary from "../Buttons/ButtonSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

type Props = {
  id: any;
  state: any;
  assignee: any;
  assignmentGroup: any;
  priority: any;
  impact: any;
  urgency: any;
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
  const { accessToken } = useAuthInfo();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (!accessToken) {
        throw new Error("User is not authenticated");
      }
      return updateTicket(accessToken, id, values);
    },

    onSuccess: () => {
      toast.success("Ticket updated!");
    },
  });

  const form = useForm({
    defaultValues: updateTicketDefaultValues(state, priority, impact, urgency),
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleSelect = (opt: any, field: any) => {
    field.handleChange(opt.value);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="assignee"
        children={(field) => (
          <SelectSecondary
            label="Assignee"
            options={[]}
            value=""
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="assignmentGroup"
        children={(field) => (
          <SelectSecondary
            label="Assignment Group"
            options={[]}
            value=""
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
