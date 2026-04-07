import {
  faFile,
  faFilePdf,
  faFileWord,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import {
  deleteForm,
  getForm,
  getUserForms,
  type FormItem,
} from "../../../../Services/forms";

type Props = {};

const UserForms = (_props: Props) => {
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
      toast.success("Formularz został usunięty!");
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
      toast.error("Nie udało się pobrać pliku");
    }
  };

  const iconFor = (mime?: string) => {
    if (mime === "application/pdf") return faFilePdf;
    if (
      mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return faFileWord;
    return faFile;
  };

  return (
    <div>
      <div className="text-[30px] font-semibold text-[#3C3C3C] pt-2">Forms</div>
      <div className="flex flex-wrap gap-4">
        {forms.length === 0 && (
          <div className="text-sm text-zinc-500 py-4">Brak formularzy</div>
        )}
        {forms.map((form) => (
          <div key={form.id} className="w-[120px] relative group">
            <button
              onClick={() => handleOpen(form)}
              className="bg-[#2B9AE9] text-[#FFFFFF] w-[100px] h-[100px] mx-auto rounded-full flex justify-center items-center text-[50px] cursor-pointer hover:opacity-90"
              title="Otwórz"
            >
              <FontAwesomeIcon icon={iconFor(form.mimetype)} />
            </button>
            <div className="text-[14px] font-bold break-all py-2 text-center">
              {form.name}
            </div>
            <button
              onClick={() => deleteMutation.mutate(form.id)}
              className="absolute top-0 right-0 text-red-500 opacity-0 group-hover:opacity-100 p-1"
              title="Usuń"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserForms;
