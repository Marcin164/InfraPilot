import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faSpinner,
  faTrash,
  faVial,
  faCloud,
  faUserGroup,
  faKey,
  faArrowsRotate,
  faShieldHalved,
  faLaptop,
  faRightToBracket,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import {
  getM365Config,
  saveM365Config,
  deleteM365Config,
  testM365Connection,
  getM365Skus,
  getM365Users,
  assignM365License,
  removeM365License,
  getM365SyncStatus,
  syncM365Users,
  syncM365Devices,
  type SubscribedSku,
} from "../../../../Services/m365";

const SKU_NAMES: Record<string, string> = {
  ENTERPRISEPREMIUM: "Microsoft 365 E5",
  ENTERPRISEPACK: "Microsoft 365 E3",
  SPE_E3: "Microsoft 365 E3",
  SPE_E5: "Microsoft 365 E5",
  O365_BUSINESS_PREMIUM: "Microsoft 365 Business Premium",
  SMB_BUSINESS_PREMIUM: "Microsoft 365 Business Premium",
  BUSINESS_BASIC: "Microsoft 365 Business Basic",
  EXCHANGE_S_ENTERPRISE: "Exchange Online (Plan 2)",
  POWER_BI_PRO: "Power BI Pro",
  PROJECTPREMIUM: "Project Plan 5",
  VISIOCLIENT: "Visio Plan 2",
  WIN10_VDA_E3: "Windows 10/11 Enterprise E3",
  INTUNE_A: "Microsoft Intune Plan 1",
};

const skuLabel = (sku: SubscribedSku) => SKU_NAMES[sku.skuPartNumber] ?? sku.skuPartNumber;
const emptyForm = { tenantId: "", clientId: "", clientSecret: "" };

const M365Settings = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [assignState, setAssignState] = useState<{ userId: string; skuId: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const configQuery = useQuery({ queryKey: ["m365-config"], queryFn: getM365Config });
  const syncStatusQuery = useQuery({ queryKey: ["m365-sync-status"], queryFn: getM365SyncStatus });

  const isConnected = !!configQuery.data?.tenantId && configQuery.data.hasSecret;

  const skusQuery = useQuery({ queryKey: ["m365-skus"], queryFn: getM365Skus, enabled: isConnected, retry: false });
  const usersQuery = useQuery({ queryKey: ["m365-users"], queryFn: getM365Users, enabled: isConnected, retry: false });

  useEffect(() => {
    if (configQuery.data) {
      setForm({ tenantId: configQuery.data.tenantId ?? "", clientId: configQuery.data.clientId ?? "", clientSecret: "" });
    }
  }, [configQuery.data]);

  const field = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setTestResult(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["m365-config"] });
    queryClient.invalidateQueries({ queryKey: ["m365-skus"] });
    queryClient.invalidateQueries({ queryKey: ["m365-users"] });
    queryClient.invalidateQueries({ queryKey: ["m365-sync-status"] });
  };

  const saveMutation = useMutation({ mutationFn: saveM365Config, onSuccess: invalidateAll });
  const deleteMutation = useMutation({ mutationFn: deleteM365Config, onSuccess: () => { invalidateAll(); setForm(emptyForm); setTestResult(null); } });
  const testMutation = useMutation({ mutationFn: testM365Connection, onSuccess: (d) => setTestResult(d) });

  const syncUsersMutation = useMutation({
    mutationFn: syncM365Users,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["m365-sync-status"] }),
  });

  const syncDevicesMutation = useMutation({
    mutationFn: syncM365Devices,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["m365-sync-status"] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, skuId }: { userId: string; skuId: string }) => assignM365License(userId, skuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["m365-users"] });
      queryClient.invalidateQueries({ queryKey: ["m365-skus"] });
      setAssignState(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ userId, skuId }: { userId: string; skuId: string }) => removeM365License(userId, skuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["m365-users"] });
      queryClient.invalidateQueries({ queryKey: ["m365-skus"] });
    },
  });

  const isLoading = saveMutation.isPending || deleteMutation.isPending || testMutation.isPending;

  const SyncResultBadge = ({ result }: { result: any }) => {
    if (!result) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
        {result.synced !== undefined && (
          <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
            Zaktualizowano: {result.synced}
          </span>
        )}
        {result.created !== undefined && (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">
            Utworzono: {result.created}
          </span>
        )}
        {result.skipped !== undefined && (
          <span className="bg-gray-50 text-gray-500 border border-gray-200 px-3 py-1 rounded-full font-medium">
            Pominięto: {result.skipped}
          </span>
        )}
        {result.unmatched !== undefined && (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
            Bez dopasowania: {result.unmatched}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="m-4 space-y-4">

      {/* ─── Config ─────────────────────────────────────────────────────── */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Microsoft 365 — konfiguracja aplikacji" icon={faCloud} />
        <div className="mt-3 text-[13px] text-[#7a7a7a] mb-4">
          Połącz InfraPilot z dzierżawcą Microsoft 365 przez aplikację zarejestrowaną w{" "}
          <span className="font-medium text-[#3C3C3C]">Microsoft Entra ID</span>.
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 mb-4 text-[14px] font-medium text-green-600">
            <FontAwesomeIcon icon={faCircleCheck} />
            Aktywna konfiguracja — Tenant: {configQuery.data?.tenantId}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Input label="Tenant ID" name="tenantId" value={form.tenantId} handleChange={field("tenantId")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          <Input label="Client ID (Application ID)" name="clientId" value={form.clientId} handleChange={field("clientId")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          <Input label={isConnected ? "Client Secret (zostaw puste, aby nie zmieniać)" : "Client Secret"} name="clientSecret" type="password" value={form.clientSecret} handleChange={field("clientSecret")} placeholder="••••••••••••••••••••" />
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <ButtonPrimary text={saveMutation.isPending ? "Zapisywanie..." : "Zapisz"} icon={saveMutation.isPending ? faSpinner : faCloud} onClick={() => saveMutation.mutate(form)} disabled={!form.tenantId || !form.clientId || isLoading} />
          <ButtonPrimary text={testMutation.isPending ? "Testowanie..." : "Testuj połączenie"} icon={testMutation.isPending ? faSpinner : faVial} onClick={() => testMutation.mutate()} disabled={!isConnected || isLoading} />
          {isConnected && (
            <ButtonPrimary text={deleteMutation.isPending ? "Usuwanie..." : "Usuń konfigurację"} icon={faTrash} className="bg-[#F3606E] hover:bg-[#e04e5c]" onClick={() => setConfirmOpen(true)} disabled={isLoading} />
          )}
        </div>

        {testResult && (
          <div className={`mt-4 flex items-center gap-2 text-[14px] font-medium ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
            <FontAwesomeIcon icon={testResult.ok ? faCircleCheck : faCircleXmark} />
            {testResult.message}
          </div>
        )}
      </div>

      {/* ─── Sync: Users ────────────────────────────────────────────────── */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Synchronizacja użytkowników z Entra ID" icon={faUsers} />
        <div className="mt-3 text-[13px] text-[#7a7a7a] mb-4">
          Importuje i aktualizuje użytkowników z Entra ID w InfraPilot. Dopasowanie po e-mailu — jeśli użytkownik nie istnieje, zostanie utworzony.
          Wymaga uprawnień: <code>User.Read.All</code>, <code>AuditLog.Read.All</code>, <code>Reports.Read.All</code>.
        </div>

        {syncStatusQuery.data?.usersLastSync && (
          <div className="text-[13px] text-[#7a7a7a] mb-3">
            Ostatnia synchronizacja: <span className="font-medium text-[#3C3C3C]">{moment(syncStatusQuery.data.usersLastSync).format("DD.MM.YYYY HH:mm:ss")}</span>
          </div>
        )}

        <ButtonPrimary
          text={syncUsersMutation.isPending ? "Synchronizowanie..." : "Synchronizuj teraz"}
          icon={syncUsersMutation.isPending ? faSpinner : faArrowsRotate}
          onClick={() => syncUsersMutation.mutate()}
          disabled={!isConnected || syncUsersMutation.isPending}
        />

        {syncUsersMutation.isError && (
          <div className="mt-3 flex items-center gap-2 text-[13px] text-red-600">
            <FontAwesomeIcon icon={faCircleXmark} />
            {(syncUsersMutation.error as any)?.response?.data?.message ?? "Błąd synchronizacji"}
          </div>
        )}
        <SyncResultBadge result={syncUsersMutation.data} />
      </div>

      {/* ─── Sync: Device compliance ─────────────────────────────────────── */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Synchronizacja compliance urządzeń (Intune)" icon={faLaptop} />
        <div className="mt-3 text-[13px] text-[#7a7a7a] mb-4">
          Pobiera status zgodności urządzeń zarządzanych przez Microsoft Intune i dopasowuje je do urządzeń w InfraPilot po numerze seryjnym.
          Wymaga uprawnień: <code>DeviceManagementManagedDevices.Read.All</code>.
        </div>

        {syncStatusQuery.data?.devicesLastSync && (
          <div className="text-[13px] text-[#7a7a7a] mb-3">
            Ostatnia synchronizacja: <span className="font-medium text-[#3C3C3C]">{moment(syncStatusQuery.data.devicesLastSync).format("DD.MM.YYYY HH:mm:ss")}</span>
          </div>
        )}

        <ButtonPrimary
          text={syncDevicesMutation.isPending ? "Synchronizowanie..." : "Synchronizuj teraz"}
          icon={syncDevicesMutation.isPending ? faSpinner : faArrowsRotate}
          onClick={() => syncDevicesMutation.mutate()}
          disabled={!isConnected || syncDevicesMutation.isPending}
        />

        {syncDevicesMutation.isError && (
          <div className="mt-3 flex items-center gap-2 text-[13px] text-red-600">
            <FontAwesomeIcon icon={faCircleXmark} />
            {(syncDevicesMutation.error as any)?.response?.data?.message ?? "Błąd synchronizacji"}
          </div>
        )}
        <SyncResultBadge result={syncDevicesMutation.data} />
      </div>

      {/* ─── SSO ────────────────────────────────────────────────────────── */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="SSO — logowanie przez Microsoft (Entra ID)" icon={faRightToBracket} />
        <div className="mt-3 text-[13px] text-[#7a7a7a] mb-4">
          InfraPilot używa <span className="font-medium text-[#3C3C3C]">PropelAuth</span> jako dostawcy tożsamości.
          Logowanie przez Microsoft (SSO) konfiguruje się bezpośrednio w dashboardzie PropelAuth — żadne zmiany w kodzie nie są potrzebne.
        </div>
        <ol className="space-y-2 text-[13px] text-[#3C3C3C] list-decimal list-inside">
          <li>Otwórz <span className="font-medium">dashboard.propelauth.com</span> → swój projekt.</li>
          <li>Przejdź do <span className="font-medium">Configuration → Social Logins / Enterprise SSO</span>.</li>
          <li>Włącz <span className="font-medium">Microsoft / Azure AD</span> jako dostawcę.</li>
          <li>Wpisz <span className="font-medium">Client ID</span> i <span className="font-medium">Client Secret</span> z aplikacji Entra ID (może być ta sama co powyżej lub osobna z uprawnieniami <code>openid profile email</code>).</li>
          <li>Skopiuj <span className="font-medium">Redirect URI</span> z PropelAuth i dodaj go w rejestracji aplikacji Entra: <em>Uwierzytelnianie → Identyfikatory URI przekierowania</em>.</li>
          <li>Zapisz — użytkownicy zobaczą przycisk "Sign in with Microsoft" na stronie logowania.</li>
        </ol>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-[13px] text-blue-700">
          Wskazówka: Jeśli chcesz wymagać SSO od wszystkich użytkowników (bez możliwości logowania hasłem), włącz opcję <span className="font-medium">Enforce SSO</span> w ustawieniach organizacji w PropelAuth.
        </div>
      </div>

      {/* ─── MFA status note ────────────────────────────────────────────── */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Status MFA użytkowników" icon={faShieldHalved} />
        <div className="mt-3 text-[13px] text-[#7a7a7a]">
          Po synchronizacji użytkowników (sekcja powyżej) status MFA z Entra ID jest widoczny w tabeli użytkowników InfraPilot jako ikona tarczy w kolumnie <span className="font-medium text-[#3C3C3C]">MFA</span>.
          Dane są pobierane z Microsoft Graph (<code>/reports/credentialUserRegistrationDetails</code>), co wymaga uprawnienia <code>Reports.Read.All</code>.
        </div>
        <div className="mt-3 flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} className="text-green-600" />
            <span>MFA włączone</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} className="text-red-400" />
            <span>MFA wyłączone</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} className="text-gray-300" />
            <span>Brak danych z Entra</span>
          </div>
        </div>
      </div>

      {/* ─── Subscribed SKUs ────────────────────────────────────────────── */}
      {isConnected && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-3">
            <CardHeader text="Subskrybowane plany licencyjne" icon={faKey} />
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ["m365-skus"] })} className="text-[13px] text-[#7a7a7a] hover:text-[#3C3C3C] flex items-center gap-1">
              <FontAwesomeIcon icon={faArrowsRotate} /> Odśwież
            </button>
          </div>
          {skusQuery.isLoading && <div className="flex items-center gap-2 text-[13px] text-[#7a7a7a] py-4"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Ładowanie planów...</div>}
          {skusQuery.isError && <div className="flex items-center gap-2 text-[13px] text-red-500 py-4"><FontAwesomeIcon icon={faCircleXmark} /> Nie można pobrać planów — sprawdź uprawnienia.</div>}
          {skusQuery.data?.map((sku) => {
            const used = sku.consumedUnits, total = sku.prepaidUnits.enabled;
            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
            const warn = pct >= 90;
            return (
              <div key={sku.id} className="border border-[#E0E0E0] rounded-[8px] p-3 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[14px] font-medium text-[#3C3C3C]">{skuLabel(sku)}</div>
                  <div className={`text-[12px] font-medium ${warn ? "text-amber-600" : "text-[#7a7a7a]"}`}>{used} / {total} miejsc ({pct}%)</div>
                </div>
                <div className="w-full bg-[#F5F5F5] rounded-full h-[6px]">
                  <div className={`h-[6px] rounded-full ${warn ? "bg-amber-400" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                {sku.capabilityStatus !== "Enabled" && <div className="mt-1 text-[11px] text-amber-600">Status: {sku.capabilityStatus}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── M365 Users ─────────────────────────────────────────────────── */}
      {isConnected && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-3">
            <CardHeader text="Użytkownicy M365 i ich licencje" icon={faUserGroup} />
            <button onClick={() => { queryClient.invalidateQueries({ queryKey: ["m365-users"] }); queryClient.invalidateQueries({ queryKey: ["m365-skus"] }); }} className="text-[13px] text-[#7a7a7a] hover:text-[#3C3C3C] flex items-center gap-1">
              <FontAwesomeIcon icon={faArrowsRotate} /> Odśwież
            </button>
          </div>
          {usersQuery.isLoading && <div className="flex items-center gap-2 text-[13px] text-[#7a7a7a] py-4"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Ładowanie użytkowników...</div>}
          {usersQuery.isError && <div className="flex items-center gap-2 text-[13px] text-red-500 py-4"><FontAwesomeIcon icon={faCircleXmark} /> Nie można pobrać użytkowników — sprawdź uprawnienia.</div>}
          {usersQuery.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#7a7a7a]">
                    <th className="text-left py-2 pr-4 font-medium">Użytkownik</th>
                    <th className="text-left py-2 pr-4 font-medium">UPN</th>
                    <th className="text-left py-2 pr-4 font-medium">Przypisane licencje</th>
                    <th className="text-right py-2 font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.map((user) => (
                    <tr key={user.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                      <td className="py-2 pr-4 font-medium text-[#3C3C3C]">{user.displayName}</td>
                      <td className="py-2 pr-4 text-[#7a7a7a]">{user.userPrincipalName}</td>
                      <td className="py-2 pr-4">
                        {user.assignedLicenses.length === 0 ? (
                          <span className="text-[#9a9a9a] italic">Brak</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.assignedLicenses.map((lic) => {
                              const sku = skusQuery.data?.find((s) => s.skuId === lic.skuId);
                              const label = sku ? skuLabel(sku) : lic.skuId;
                              return (
                                <span key={lic.skuId} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded-full border border-blue-200">
                                  {label}
                                  <button onClick={() => removeMutation.mutate({ userId: user.id, skuId: lic.skuId })} className="ml-0.5 hover:text-red-500" title="Usuń licencję">×</button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {assignState?.userId === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <select className="text-[12px] border border-[#E0E0E0] rounded-[6px] px-2 py-1 outline-none" value={assignState.skuId} onChange={(e) => setAssignState({ userId: user.id, skuId: e.target.value })}>
                              <option value="">Wybierz plan...</option>
                              {(skusQuery.data ?? []).filter((s) => s.capabilityStatus === "Enabled" && s.prepaidUnits.enabled > s.consumedUnits).map((s) => (
                                <option key={s.skuId} value={s.skuId}>{skuLabel(s)}</option>
                              ))}
                            </select>
                            <button onClick={() => { if (assignState.skuId) assignMutation.mutate({ userId: user.id, skuId: assignState.skuId }); }} disabled={!assignState.skuId || assignMutation.isPending} className="text-[12px] bg-[#3B82F6] text-white px-3 py-1 rounded-[6px] hover:bg-[#2563EB] disabled:opacity-50">
                              {assignMutation.isPending ? "..." : "Przypisz"}
                            </button>
                            <button onClick={() => setAssignState(null)} className="text-[12px] text-[#7a7a7a] hover:text-[#3C3C3C]">Anuluj</button>
                          </div>
                        ) : (
                          <button onClick={() => setAssignState({ userId: user.id, skuId: "" })} className="text-[12px] text-blue-600 hover:text-blue-800">+ Przypisz licencję</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Setup guide ────────────────────────────────────────────────── */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Jak skonfigurować aplikację w Microsoft Entra ID" icon={faCloud} />
        <div className="mt-3 text-[13px] text-[#7a7a7a] mb-3 font-medium">Wymagane uprawnienia aplikacji (Application permissions):</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {[
            ["Organization.Read.All", "Test połączenia"],
            ["User.Read.All", "Lista użytkowników"],
            ["User.ReadWrite.All", "Przypisywanie licencji M365"],
            ["Directory.Read.All", "Dane katalogowe"],
            ["AuditLog.Read.All", "Ostatnie logowanie użytkowników"],
            ["Reports.Read.All", "Status MFA użytkowników"],
            ["DeviceManagementManagedDevices.Read.All", "Compliance urządzeń (Intune)"],
          ].map(([perm, desc]) => (
            <div key={perm} className="flex items-start gap-2 text-[13px]">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div><code className="font-medium text-[#3C3C3C]">{perm}</code><span className="text-[#7a7a7a]"> — {desc}</span></div>
            </div>
          ))}
        </div>
        <ol className="space-y-1.5 text-[13px] text-[#3C3C3C] list-decimal list-inside">
          <li>Otwórz <span className="font-medium">portal.azure.com</span> → Microsoft Entra ID → Rejestracje aplikacji → Nowa rejestracja.</li>
          <li>Nadaj nazwę (np. <em>InfraPilot</em>), kliknij Zarejestruj.</li>
          <li>Skopiuj <span className="font-medium">Identyfikator aplikacji (klienta)</span> — to jest Client ID.</li>
          <li>Skopiuj <span className="font-medium">Identyfikator katalogu (dzierżawcy)</span> — to jest Tenant ID.</li>
          <li>Przejdź do <span className="font-medium">Certyfikaty i klucze tajne</span> → Nowy klucz tajny klienta. Skopiuj wartość — to jest Client Secret.</li>
          <li>Przejdź do <span className="font-medium">Uprawnienia interfejsu API</span>, dodaj wszystkie uprawnienia z listy powyżej jako <em>Uprawnienia aplikacji</em>.</li>
          <li>Kliknij <span className="font-medium">Udziel zgody administratora</span>.</li>
        </ol>
      </div>

      <ConfirmationModal
        isModalOpen={confirmOpen}
        handleOnClose={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
        onDelete={() => { deleteMutation.mutate(); setConfirmOpen(false); }}
      />
    </div>
  );
};

export default M365Settings;
