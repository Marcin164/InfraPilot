// Google API errors arrive either as google-auth-library auth failures
// (invalid_grant during JWT exchange) or as Licensing API HTTP error bodies
// (see GoogleWorkspaceService) — meaningless to an admin without the Google
// error reference open. Maps the well-known cases to a message that says
// what to actually go check in Google Cloud Console / Admin console.

export function describeGoogleError(error: any): string {
  const raw = String(error?.message ?? error ?? '').trim();
  if (!raw) return 'Nieznany błąd Google Workspace';

  if (/invalid_grant/i.test(raw)) {
    return 'Nie udało się zaimpersonować podanego Admin Email — sprawdź czy Domain-Wide Delegation jest włączone dla tego konta serwisowego (Client ID + zakres w Google Admin Console > Security > API controls) i czy adres e-mail istnieje w domenie.';
  }
  if (/invalid_rsa_private_key|error:1E08010C|PEM/i.test(raw)) {
    return 'Nieprawidłowy klucz JSON konta serwisowego — sprawdź czy wklejono cały plik JSON pobrany z Google Cloud Console (Keys > Add key > JSON).';
  }
  if (/accessNotConfigured|has not been used in project|is disabled/i.test(raw)) {
    return 'Enterprise License Manager API nie jest włączone w projekcie Google Cloud dla tego konta serwisowego — włącz je w Google Cloud Console > APIs & Services.';
  }
  if (/403|forbidden/i.test(raw)) {
    return 'Brak uprawnień do odczytu licencji — sprawdź zakres https://www.googleapis.com/auth/apps.licensing w Domain-Wide Delegation i czy Admin Email ma rolę administratora.';
  }
  if (/404|not found/i.test(raw)) {
    return 'Nie znaleziono podanego productId/skuId — sprawdź poprawność identyfikatorów SKU w konfiguracji.';
  }

  return raw;
}
