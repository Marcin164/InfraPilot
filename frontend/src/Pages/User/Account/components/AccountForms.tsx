import {
  faFile,
  faFilePdf,
  faFileWord,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import { getForm, type FormItem } from "../../../../Services/forms";

type Props = {
  forms: FormItem[];
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

const AccountForms = ({ forms }: Props) => {
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

  return (
    <div className="rounded-[10px] bg-white p-4 shadow-xl">
      <div className="pt-2 text-[30px] font-semibold text-[#3C3C3C]">Forms</div>
      <div className="flex flex-wrap gap-4">
        {forms.length === 0 && (
          <div className="py-4 text-sm text-[#8A8A8A]">No forms</div>
        )}
        {forms.map((form) => (
          <div key={form.id} className="w-[120px]">
            <button
              onClick={() => handleOpen(form)}
              className="mx-auto flex h-[100px] w-[100px] cursor-pointer items-center justify-center rounded-full bg-[#2B9AE9] text-[50px] text-white hover:opacity-90"
              title="Open"
            >
              <FontAwesomeIcon icon={iconFor(form.mimetype)} />
            </button>
            <div className="break-all py-2 text-center text-[14px] font-bold">
              {form.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountForms;
