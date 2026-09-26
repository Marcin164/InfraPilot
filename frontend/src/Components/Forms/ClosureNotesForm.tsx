import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import { closureCodesOptions } from "../../Constants/options";
import { toast } from "react-toastify";
import { updateTicket, documentSolution } from "../../Services/tickets";
import { getAiSettings } from "../../Services/ai";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { usePermissions } from "../../Hooks/usePermissions";
import { hasPermission } from "../../Constants/navigation";

import type { ClosureCode, UpdateTicketData } from "../../Types";

type Props = {
  closureCode?: ClosureCode;
  closureNotes?: string;
};

const ClosureNotesForm = ({ closureCode, closureNotes }: Props) => {
  const { t } = useTranslation();
  const params = useParams();
  const permissionsQuery = usePermissions();
  const canEdit = hasPermission("helpdesk.tickets.access", permissionsQuery.data);
  const trClosure = closureCodesOptions.map((o) => ({ ...o, label: t(o.label) }));
  const mutation = useMutation({
    mutationFn: async (values: UpdateTicketData) => {
      return updateTicket(params.id!, values);
    },

    onSuccess: () => {
      toast.success(t("toast.success.ticketUpdated"));
    },
  });

  const aiSettingsQuery = useQuery({
    queryKey: ["ai-settings"],
    queryFn: getAiSettings,
    enabled: canEdit,
  });
  const canDocumentSolution =
    aiSettingsQuery.data?.enabledSurfaces.includes("ticketClosureSummary") ?? true;

  const documentSolutionMutation = useMutation({
    mutationFn: () => documentSolution(params.id!),
    onSuccess: (article) => {
      toast.success(
        <span>
          {t("helpdesk.solutionDocumented")}{" "}
          <Link
            to={`/admin/knowledge/${article.spaceId}/${article.id}`}
            className="underline"
          >
            {t("helpdesk.solutionDocumentedLink")}
          </Link>
        </span>,
      );
    },
    onError: (err: any) =>
      toast.error(
        err?.response?.data?.message ?? t("helpdesk.solutionDocumentFailed"),
      ),
  });

  const form = useForm({
    defaultValues: {
      closureCode: closureCode ?? "",
      closureNotes: closureNotes ?? "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleSelect = (opt: any, field: any) => {
    field.handleChange(opt.value);
  };

  if (!canEdit) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="closureCode"
        children={(field) => (
          <SelectSecondary
            label={t("form.field.closureCode")}
            options={trClosure}
            value={trClosure.find((opt) => opt.value === field.state.value)}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="closureNotes"
        children={(field) => (
          <Input
            name={field.name}
            value={field.state.value}
            onChange={(e: any) => field.handleChange(e.target.value)}
            label={t("form.field.closureNotes")}
          />
        )}
      />
      <ButtonPrimary type="submit" text={t("common.save")} className="mt-4 mb-2" />

      {canDocumentSolution && (
        <>
          <ButtonPrimary
            type="button"
            color="white"
            icon={faBook}
            text={
              documentSolutionMutation.isPending
                ? t("helpdesk.documentingSolution")
                : t("helpdesk.documentSolution")
            }
            className="mb-2"
            disabled={documentSolutionMutation.isPending}
            onClick={() => documentSolutionMutation.mutate()}
          />
          <p className="text-[11px] text-[#9a9a9a] -mt-1 mb-2">
            {t("helpdesk.documentSolutionHint")}
          </p>
        </>
      )}
    </form>
  );
};

export default ClosureNotesForm;
