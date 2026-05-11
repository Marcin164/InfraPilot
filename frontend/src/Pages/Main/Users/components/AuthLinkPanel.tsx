import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  faCheck,
  faKey,
  faLink,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  linkUserAuth,
  provisionUserAuth,
  verifyUserAuth,
  updateUser,
} from "../../../../Services/users";

type Props = {
  user: any;
};

const AuthLinkPanel = ({ user }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftId, setDraftId] = useState(user.authUserId ?? "");

  const verifyQuery = useQuery({
    queryKey: ["auth-verify", user.id, user.authUserId],
    queryFn: () => verifyUserAuth(user.id),
    enabled: Boolean(user.id),
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["auth-verify", user.id] });
    queryClient.invalidateQueries({ queryKey: ["user", user.id] });
  };

  const linkMutation = useMutation({
    mutationFn: () => linkUserAuth(user.id),
    onSuccess: (res) => {
      if (res.linked) toast.success(t("toast.success.linkedToPropelAuth"));
      else toast.error(res.reason ?? t("users.auth.noUserFound"));
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("users.auth.linkFailed")),
  });

  const provisionMutation = useMutation({
    mutationFn: () => provisionUserAuth(user.id),
    onSuccess: (res) => {
      toast.success(
        res.created ? t("users.auth.userCreated") : t("users.auth.linkedExisting"),
      );
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("users.auth.provisionFailed")),
  });

  const manualSave = useMutation({
    mutationFn: () =>
      updateUser({ authUserId: draftId.trim() || null } as any, user.id),
    onSuccess: () => {
      toast.success(t("toast.success.authUserIdSaved"));
      setEditing(false);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("users.auth.saveFailed")),
  });

  const linked = Boolean(user.authUserId);
  const valid = verifyQuery.data?.valid;
  const status = !linked
    ? { color: "#F1C40F", label: t("users.auth.notLinked") }
    : valid === false
      ? { color: "#F3606E", label: t("users.auth.broken") }
      : valid === true
        ? { color: "#30A712", label: t("users.auth.linked") }
        : { color: "#8A8A8A", label: t("users.auth.verifying") };

  return (
    <div className="pt-4">
      <CardHeader text={t("users.auth.title")} icon={faKey} />

      <div className="mt-2 flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </span>
        {linked && (
          <code className="text-[12px] text-[#535353] break-all">
            {user.authUserId}
          </code>
        )}
        {linked && verifyQuery.data?.email && (
          <span className="text-[11px] text-[#9a9a9a]">
            ({verifyQuery.data.email})
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!linked && user.email && (
          <ButtonPrimary
            icon={faLink}
            text={linkMutation.isPending ? t("users.auth.linking") : t("users.auth.linkByEmail")}
            onClick={() => linkMutation.mutate()}
            disabled={linkMutation.isPending}
          />
        )}
        {!linked && user.email && (
          <ButtonPrimary
            icon={faCheck}
            color="green"
            text={
              provisionMutation.isPending
                ? t("users.auth.provisioning")
                : t("users.auth.provision")
            }
            onClick={() => provisionMutation.mutate()}
            disabled={provisionMutation.isPending}
          />
        )}
        <ButtonPrimary
          icon={faPen}
          color="white"
          text={editing ? t("common.cancel") : t("users.auth.editId")}
          onClick={() => {
            setEditing((v) => !v);
            setDraftId(user.authUserId ?? "");
          }}
        />
      </div>

      {editing && (
        <div className="mt-3 flex items-end gap-2">
          <Input
            className="flex-1 pt-0"
            label={t("users.auth.userId")}
            value={draftId}
            handleChange={setDraftId}
            placeholder={t("users.auth.idPlaceholder")}
          />
          <ButtonPrimary
            icon={faCheck}
            text={manualSave.isPending ? t("common.saving") : t("common.save")}
            onClick={() => manualSave.mutate()}
            disabled={manualSave.isPending}
          />
        </div>
      )}

      {!user.email && !linked && (
        <div className="mt-3 text-[12px] text-[#F1C40F]">
          <FontAwesomeIcon icon={faKey} /> {t("users.auth.noEmailHelp")}
        </div>
      )}
    </div>
  );
};

export default AuthLinkPanel;
