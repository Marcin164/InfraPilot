import { useTranslation } from "react-i18next";
import {
  faFile,
  faFilePdf,
  faFileWord,
  faTrash,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import CardHeader from "../../../../Components/Headers/CardHeader";
import {
  deleteForm,
  getForm,
  getUserForms,
  type FormItem,
} from "../../../../Services/forms";

const UserForms = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: forms = [] } = useQuery<FormItem[]>({
    queryKey: ["forms", id],
    queryFn: () => getUserForms(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (formId: string) => deleteForm(formId),
    onSuccess: () => {
      toast.success(t("toast.success.formRemoved"));
      queryClient.invalidateQueries({ queryKey: ["forms", id] });
    },
  });

  const handleOpen = async (form: FormItem) => {
    try {
      const blob = await getForm(form.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error(t("toast.error.fileDownload"));
    }
  };

  const iconFor = (mime?: string) => {
    if (mime === "application/pdf") return faFilePdf;
    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      return faFileWord;
    return faFile;
  };

  const iconColor = (mime?: string) => {
    if (mime === "application/pdf") return "text-[#F3606E]";
    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      return "text-[#2B9AE9]";
    return "text-[#9a9a9a]";
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("users.forms")} icon={faFile} />
      {forms.length === 0 ? (
        <div className="mt-3 text-[13px] text-[#9a9a9a]">{t("users.forms.empty")}</div>
      ) : (
        <div className="mt-3 divide-y divide-[#F0F0F0]">
          {forms.map((form) => (
            <div key={form.id} className="flex items-center justify-between gap-3 py-2 group">
              <div className="flex items-center gap-3 min-w-0">
                <FontAwesomeIcon
                  icon={iconFor(form.mimetype)}
                  className={`text-[18px] shrink-0 ${iconColor(form.mimetype)}`}
                />
                <span className="text-[13px] font-semibold text-[#3C3C3C] truncate">
                  {form.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpen(form)}
                  className="text-[#2B9AE9] hover:text-[#1a7abf] text-[13px]"
                  title={t("users.forms.open")}
                >
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(form.id)}
                  className="text-[#F3606E] hover:text-[#d94055] text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t("users.forms.delete")}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserForms;
