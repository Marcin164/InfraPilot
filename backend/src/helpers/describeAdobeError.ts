// Adobe errors arrive either as IMS OAuth token failures (see
// AdobeService.getToken) or as User Management API error bodies --
// meaningless to an admin without the Adobe error reference open. Maps the
// well-known cases to a message that says what to actually go check in the
// Adobe Developer Console / Admin Console.

export function describeAdobeError(error: any): string {
  const raw = String(error?.message ?? error ?? '').trim();
  if (!raw) return 'Nieznany błąd Adobe';

  if (/invalid_client/i.test(raw)) {
    return 'Nieprawidłowy Client ID lub Client Secret — sprawdź dane poświadczenia OAuth Server-to-Server w Adobe Developer Console.';
  }
  if (/Adobe 403|Forbidden/i.test(raw)) {
    return 'Brak dostępu do User Management API — sprawdź czy dodano to API do projektu w Adobe Developer Console i przypisano poprawne poświadczenie.';
  }
  if (/Adobe 404/i.test(raw)) {
    return 'Nie znaleziono organizacji lub nazwy profilu (Product Profile) — sprawdź Org ID oraz dokładną nazwę profilu w Adobe Admin Console.';
  }
  if (/Adobe 401/i.test(raw)) {
    return 'Token odrzucony przez Adobe — sprawdź czy poświadczenie nie wygasło i czy scope obejmuje user_management_sdk.';
  }

  return raw;
}
