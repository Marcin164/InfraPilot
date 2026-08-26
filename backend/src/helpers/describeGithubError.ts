// GitHub REST API errors arrive as raw `GitHub <status>: {"message":"..."}`
// strings (see GithubEnterpriseService) — meaningless to an admin without
// the GitHub error reference open. Maps the well-known cases to a message
// that says what to actually go check.

export function describeGithubError(error: any): string {
  const raw = String(error?.message ?? error ?? '').trim();
  if (!raw) return 'Nieznany błąd GitHub';

  if (/GitHub 401|Bad credentials/i.test(raw)) {
    return 'Nieprawidłowy lub wygasły token — sprawdź Personal Access Token (classic) w GitHub > Settings > Developer settings.';
  }
  if (/GitHub 403|requires the read:enterprise/i.test(raw)) {
    return 'Token nie ma wymaganego zakresu read:enterprise — dodaj ten scope przy tworzeniu/edycji tokena.';
  }
  if (/GitHub 404/i.test(raw)) {
    return 'Nie znaleziono enterprise o podanym identyfikatorze (slug) — sprawdź adres w GitHub Enterprise.';
  }

  return raw;
}
