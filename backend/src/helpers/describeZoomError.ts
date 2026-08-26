// Zoom errors arrive either as OAuth token failures (see ZoomService.getToken)
// or as REST API error bodies -- meaningless to an admin without the Zoom
// error reference open. Maps the well-known cases to a message that says
// what to actually go check in the Zoom App Marketplace.

export function describeZoomError(error: any): string {
  const raw = String(error?.message ?? error ?? '').trim();
  if (!raw) return 'Nieznany błąd Zoom';

  if (/invalid_client|Invalid client/i.test(raw)) {
    return 'Nieprawidłowy Client ID lub Client Secret — sprawdź dane aplikacji Server-to-Server OAuth w Zoom App Marketplace.';
  }
  if (/invalid_request.*account|Account does not exist/i.test(raw)) {
    return 'Nieprawidłowy Account ID — sprawdź wartość w Zoom App Marketplace > swoja aplikacja > App Credentials.';
  }
  if (/Zoom 401/i.test(raw)) {
    return 'Token odrzucony przez Zoom — sprawdź czy aplikacja Server-to-Server OAuth ma przyznany zakres user:read:admin (lub user:read:list_users:admin) i jest aktywowana.';
  }

  return raw;
}
