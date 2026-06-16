import { useState, useEffect } from "react";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faVial,
  faCircleCheck,
  faCircleXmark,
  faTrash,
  faSpinner,
  faServer,
} from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getSmtpConfig,
  saveSmtpConfig,
  deleteSmtpConfig,
  testSmtpConnection,
  type SmtpConfig,
} from "../../../../Services/smtp";
import Checkbox from "../../../../Components/Inputs/Checkbox";

const emptyForm: SmtpConfig = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  from: "",
};

const SmtpSettings = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SmtpConfig>(emptyForm);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configQuery = useQuery({
    queryKey: ["smtp-config"],
    queryFn: getSmtpConfig,
  });

  useEffect(() => {
    if (configQuery.data) {
      setForm({
        host: configQuery.data.host ?? "",
        port: configQuery.data.port ?? 587,
        secure: configQuery.data.secure ?? false,
        user: configQuery.data.user ?? "",
        pass: "",
        from: configQuery.data.from ?? "",
      });
    }
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveSmtpConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-config"] });
      setTestResult(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSmtpConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-config"] });
      setForm(emptyForm);
      setTestResult(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: testSmtpConnection,
    onSuccess: (data) => setTestResult(data),
  });

  const field = (key: keyof SmtpConfig) => (value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "port" ? parseInt(value, 10) || 587 : value,
    }));
    setTestResult(null);
  };

  const isLoading =
    saveMutation.isPending || deleteMutation.isPending || testMutation.isPending;

  return (
    <div className="m-4 space-y-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Serwer pocztowy SMTP" icon={faServer} />

        <div className="mt-3 text-[13px] text-[#7a7a7a] mb-4">
          Konfiguracja zapisana tutaj nadpisuje zmienne środowiskowe{" "}
          <code>SMTP_*</code> z pliku <code>.env</code>. Możesz podłączyć
          firmowy serwer pocztowy lub zewnętrzny (np. Gmail, Outlook).
        </div>

        {configQuery.data?.host && (
          <div className="flex items-center gap-2 mb-4 text-[14px] font-medium text-green-600">
            <FontAwesomeIcon icon={faCircleCheck} />
            Aktywna konfiguracja: {configQuery.data.host}:{configQuery.data.port}
            {configQuery.data.user && ` (${configQuery.data.user})`}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Input
            label="Serwer SMTP (host)"
            name="host"
            value={form.host}
            handleChange={field("host")}
            placeholder="np. smtp.gmail.com lub mail.firma.pl"
          />
          <Input
            label="Port"
            name="port"
            value={String(form.port)}
            handleChange={field("port")}
            placeholder="587"
          />
          <Input
            label="Użytkownik (login)"
            name="user"
            value={form.user}
            handleChange={field("user")}
            placeholder="konto@firma.pl"
          />
          <Input
            label={
              configQuery.data?.hasPass
                ? "Hasło (zostaw puste aby nie zmieniać)"
                : "Hasło"
            }
            name="pass"
            type="password"
            value={form.pass}
            handleChange={field("pass")}
          />
          <Input
            label="Adres nadawcy (From)"
            name="from"
            value={form.from}
            handleChange={field("from")}
            placeholder="noreply@firma.pl"
          />
          <div className="flex items-end pb-2">
            <Checkbox
              id="smtp-secure"
              label="TLS (port 465) — wyłącz dla STARTTLS (port 587)"
              checked={form.secure}
              handleChange={(v: boolean) => setForm((p) => ({ ...p, secure: v }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <ButtonPrimary
            text={saveMutation.isPending ? "Zapisywanie..." : "Zapisz"}
            icon={saveMutation.isPending ? faSpinner : faEnvelope}
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.host || isLoading}
          />
          <ButtonPrimary
            text={testMutation.isPending ? "Testowanie..." : "Testuj połączenie"}
            icon={testMutation.isPending ? faSpinner : faVial}
            onClick={() => testMutation.mutate(form)}
            disabled={!form.host || isLoading}
          />
          {configQuery.data?.host && (
            <ButtonPrimary
              text={
                deleteMutation.isPending ? "Usuwanie..." : "Usuń (wróć do .env)"
              }
              icon={faTrash}
              className="bg-[#F3606E] hover:bg-[#e04e5c]"
              onClick={() => setConfirmOpen(true)}
              disabled={isLoading}
            />
          )}
        </div>

        {(testResult || saveMutation.data || deleteMutation.data) && (
          <div
            className={`mt-4 flex items-center gap-2 text-[14px] font-medium ${
              (testResult || saveMutation.data || deleteMutation.data)?.success
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            <FontAwesomeIcon
              icon={
                (testResult || saveMutation.data || deleteMutation.data)
                  ?.success
                  ? faCircleCheck
                  : faCircleXmark
              }
            />
            {(testResult || saveMutation.data || deleteMutation.data)?.message}
          </div>
        )}
      </div>

      <ConfirmationModal
        isModalOpen={confirmOpen}
        handleOnClose={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
        onDelete={() => { deleteMutation.mutate(); setConfirmOpen(false); }}
      />

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Wskazówki konfiguracji" icon={faEnvelope} />
        <div className="mt-3 space-y-3 text-[14px] text-[#3C3C3C]">
          <div>
            <span className="font-semibold">Firmowy serwer pocztowy:</span>{" "}
            <code>host=mail.firma.pl port=587 secure=false</code>, użyj konta
            serwisowego z uprawnieniami do wysyłki.
          </div>
          <div>
            <span className="font-semibold">Gmail:</span>{" "}
            <code>host=smtp.gmail.com port=587 secure=false</code> — wymagane
            hasło aplikacji (Google Account → Bezpieczeństwo → Hasła aplikacji).
          </div>
          <div>
            <span className="font-semibold">Outlook/Office 365:</span>{" "}
            <code>host=smtp.office365.com port=587 secure=false</code>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmtpSettings;
