// Microsoft Graph errors arrive as raw `Graph <status>: {"error":{"code":"...",
// "message":"..."}}` strings (see M365Service.graphGet) — meaningless to an
// admin without the Graph error code reference open. Maps the well-known
// codes to a message that says what to actually go check in Entra ID /
// Microsoft 365 admin center.

export function describeGraphError(error: any): string {
  const raw = String(error?.message ?? error ?? '').trim();
  if (!raw) return 'Nieznany błąd Microsoft Graph';

  if (/Authorization_RequestDenied/i.test(raw)) {
    return 'Brakuje wymaganych uprawnień Microsoft Graph — w Entra ID sprawdź, czy są dodane jako Application permissions (nie Delegated) i czy kliknięto „Grant admin consent”.';
  }
  if (/NonPremiumTenantOrB2CTenant/i.test(raw)) {
    return 'Ten tenant nie ma wymaganej licencji Entra ID Premium (P1/P2) dla tej operacji.';
  }
  if (/Request not applicable to target tenant/i.test(raw)) {
    return 'Ta funkcja (Intune / Microsoft Endpoint Manager) nie jest aktywowana lub licencjonowana w tym tenancie.';
  }
  if (/InvalidAuthenticationToken|AADSTS7000215|invalid_client/i.test(raw)) {
    return 'Nieprawidłowy Client Secret — sprawdź czy nie wygasł i czy skopiowano jego wartość (nie Secret ID) w Entra ID > Certificates & secrets.';
  }
  if (/unauthorized_client|AADSTS700016/i.test(raw)) {
    return 'Nieprawidłowy Tenant ID lub Client ID — sprawdź wartości w Entra ID > App registrations.';
  }

  return raw;
}
