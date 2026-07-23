// Active Directory / LDAP errors arrive as opaque strings like
// "80090308: LdapErr: DSID-0C090434, comment: AcceptSecurityContext error,
// data 52e, v4f7c" — meaningless to an admin without an AD reference table
// open. This maps the well-known bits (the `data <code>` sub-code on bind
// failures, common Node network error codes, TLS trust failures) to a
// message that says what to actually go check.

// https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/troubleshoot-ldap-error-code-52e-authentication-failure
const AD_BIND_SUBCODES: Record<string, string> = {
  '525': 'Nie znaleziono takiego konta w Active Directory — sprawdź nazwę użytkownika (Service Account)',
  '52e': 'Nieprawidłowa nazwa użytkownika lub hasło konta usługi',
  '530': 'To konto nie ma prawa logować się o tej porze (ograniczenia godzin logowania w AD)',
  '531': 'To konto nie ma uprawnień do logowania z tej stacji roboczej',
  '532': 'Hasło konta usługi wygasło — zaloguj się nim ręcznie i ustaw nowe',
  '533': 'To konto jest wyłączone (disabled) w Active Directory',
  '701': 'Ważność tego konta wygasła (account expired)',
  '773': 'Konto wymaga zmiany hasła przy najbliższym logowaniu — zaloguj się nim ręcznie i ustaw nowe hasło',
  '775': 'To konto jest zablokowane (locked out) po zbyt wielu nieudanych próbach logowania',
};

export function describeAdError(error: any): string {
  const raw = String(error?.message ?? error ?? '').trim();
  if (!raw) return 'Nieznany błąd połączenia z Active Directory';

  const subcode = raw.match(/data (\d[0-9a-f]*)/i)?.[1]?.toLowerCase();
  if (subcode && AD_BIND_SUBCODES[subcode]) {
    return `${AD_BIND_SUBCODES[subcode]} (kod AD: ${subcode})`;
  }
  if (/AcceptSecurityContext error/i.test(raw)) {
    return `Serwer AD odrzucił dane logowania konta usługi (${raw})`;
  }

  if (/ENOTFOUND|EAI_AGAIN/i.test(raw)) {
    const host = raw.match(/(?:ENOTFOUND|EAI_AGAIN)\s+(\S+)/)?.[1];
    return `Nie udało się rozwiązać nazwy serwera LDAP${host ? ` „${host}”` : ''} (DNS) — sprawdź czy adres jest poprawny i czy ta nazwa jest widoczna z tego serwera`;
  }
  if (/ECONNREFUSED/i.test(raw)) {
    return 'Serwer LDAP odrzucił połączenie — sprawdź adres i port (usługa AD DS może nie nasłuchiwać na tym porcie, albo firewall blokuje ruch)';
  }
  if (/ETIMEDOUT|ECONNRESET/i.test(raw)) {
    return 'Przekroczono czas oczekiwania na połączenie z serwerem LDAP — sprawdź adres, port i czy firewall nie blokuje ruchu między tym serwerem a AD';
  }
  if (/self.signed certificate|unable to verify the first certificate|UNABLE_TO_VERIFY_LEAF_SIGNATURE|CERT_HAS_EXPIRED/i.test(raw)) {
    return 'Serwer LDAPS przedstawia certyfikat, który nie jest zaufany przez ten serwer — wgraj certyfikat CA w sekcji „Certyfikat CA (LDAPS)” poniżej';
  }
  if (/size limit exceeded/i.test(raw)) {
    return 'Serwer AD zwrócił zbyt wiele wyników naraz (przekroczony limit) — zawęź Base DN albo zwiększ limit po stronie AD';
  }

  return raw;
}
