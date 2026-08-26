// Dropbox errors arrive either as OAuth token-refresh failures (see
// DropboxService.getToken) or as Business API error bodies -- meaningless to
// an admin without the Dropbox error reference open. Maps the well-known
// cases to a message that says what to actually go check in the App Console.

export function describeDropboxError(error: any): string {
  const raw = String(error?.message ?? error ?? '').trim();
  if (!raw) return 'Nieznany błąd Dropbox';

  if (/invalid_grant/i.test(raw)) {
    return 'Refresh token jest nieprawidłowy, wygasł lub został cofnięty — wygeneruj nowy zgodnie z instrukcją i wklej ponownie.';
  }
  if (/invalid_client/i.test(raw)) {
    return 'Nieprawidłowy App Key lub App Secret — sprawdź dane aplikacji w Dropbox App Console.';
  }
  if (/Dropbox 401|missing_scope|insufficient_scope/i.test(raw)) {
    return 'Brak wymaganego zakresu (members.read / team_info.read) — dodaj go w Dropbox App Console > Permissions i wygeneruj refresh token ponownie.';
  }
  if (/Dropbox 400|Dropbox 403/i.test(raw)) {
    return 'Aplikacja nie ma dostępu do zespołu (Team) — sprawdź czy jest to aplikacja typu Team i czy administrator zatwierdził jej uprawnienia.';
  }

  return raw;
}
