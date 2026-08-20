# Deployment Guide — InfraPilot

Docelowe środowisko: Ubuntu 22, Nginx, Docker Compose.  
Architektura: frontend (port 80 via Nginx), backend API (port 3000), PostgreSQL (wewnętrzny).

---

## 1. Wymagania wstępne na serwerze

### Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker
```

### Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

Sprawdź czy działa:
```bash
sudo systemctl status nginx
curl http://localhost   # domyślna strona powitalna Nginx
```

> Domyślny firewall Ubuntu (`ufw`), jeśli jest włączony, blokuje ruch przychodzący
> domyślnie — dopuść HTTP/HTTPS:
> ```bash
> sudo ufw allow 'Nginx Full'
> ```
> Sprawdź stan: `sudo ufw status`. Jeśli `ufw` jest nieaktywny (`inactive`), ten krok
> nie jest potrzebny.

---

## 2. Struktura plików na serwerze

```
/opt/infrapilot/
├── docker-compose.yml        ← w repo, nie edytujemy per-instalację
├── .env                      ← JEDYNY plik do skonfigurowania (skopiowany z .env.example)
├── backend/
│   └── src/...
└── frontend/
    └── src/...
```

Jeden `.env` w roocie to jedyne miejsce konfiguracji — jest jednocześnie plikiem, z
którego Compose podstawia `${ZMIENNE}` w samym `docker-compose.yml` (build-argi,
konfiguracja `db:`), i plikiem wstrzykiwanym do kontenera `api` w runtime
(`env_file:`). `docker-compose.yml` jest częścią repo i nie wymaga ręcznej edycji —
jedyne co edytujesz per-instalację to `.env`.

Skopiuj projekt:
```bash
git clone https://github.com/Marcin164/InfraPilot.git /opt/infrapilot
# lub rsync z lokalnej maszyny:
# rsync -avz --exclude node_modules --exclude dist ./  user@server:/opt/infrapilot/
```

---

## 3. Konfiguracja

```bash
cd /opt/infrapilot
cp .env.example .env
nano .env
```

> **Pierwszy deploy:** ustaw `ADMIN_EMAIL` na swój email z PropelAuth. Przy starcie aplikacja automatycznie stworzy konto admina jeśli baza jest pusta. Po pierwszym uruchomieniu możesz tę wartość usunąć.

Kluczowe wartości do wypełnienia w `.env` (pełna lista z komentarzami jest w
`.env.example` — poniżej tylko te, które naprawdę musisz zmienić na starcie):

```env
# PropelAuth
PROPELAUTH_AUTH_URL=https://<tenant>.propelauthtest.com
PROPELAUTH_API_KEY=<klucz>
VITE_AUTH_URL=https://<tenant>.propelauthtest.com

# Baza danych
DB_USERNAME=infrapilot
DB_PASSWORD=<silne-haslo>
DB_NAME=InfraPilot

# Szyfrowanie — wygeneruj: openssl rand -hex 32
# Zgubienie tego klucza = trwała utrata dostępu do wszystkich zaszyfrowanych
# sekretów (hasło bind AD, dane SSH urządzeń, SMTP). Trzymaj kopię offline
# (menedżer haseł), nie tylko w tym pliku na serwerze.
ENCRYPTION_KEY=<32-znakowy-hex>

# Origin, pod którym otwierasz apkę w przeglądarce — bez trailing slash, bez portu
CORS_ORIGINS=http://192.168.1.41
AGENT_PUBLIC_BASE_URL=http://192.168.1.41/api

TRUST_PROXY=true
MFA_REQUIRED=true
TYPEORM_SYNCHRONIZE=true
ADMIN_EMAIL=twoj@email.com
```

Generowanie ENCRYPTION_KEY:
```bash
openssl rand -hex 32
```

---

## 4. Docker Compose

`docker-compose.yml` jest w repo (`/opt/infrapilot/docker-compose.yml`) — nie trzeba
go ręcznie tworzyć ani edytować przy zwykłym wdrożeniu. Zawiera `db`, `api`,
`frontend` oraz opcjonalny stack obserwowalności (`postgres_exporter`,
`prometheus`, `grafana` — jeśli ich nie chcesz, po prostu zignoruj te porty, albo
usuń te serwisy z pliku).

> **Ważne — dlaczego `127.0.0.1:3000:3000`, nie `3000:3000`:** publikowanie
> portu kontenera na `0.0.0.0` (czyli sam `3000:3000`) wystawia backend
> bezpośrednio do sieci, w plain HTTP, z pominięciem Nginx — czyli bez TLS,
> bez nagłówków bezpieczeństwa i **bez ochrony firewalla**. Docker wstawia
> własne reguły NAT z priorytetem wyższym niż standardowy łańcuch `input`
> w nftables/iptables, więc reguła „zablokuj port 3000” w typowym firewallu
> i tak nie zadziała na publikowany port kontenera (ruch idzie przez
> `forward`, nie przez `input`). Bindowanie do `127.0.0.1` sprawia, że port
> w ogóle nie jest widoczny z zewnątrz — Nginx na hoście łączy się z nim po
> `localhost`, tak jak już robi to dla frontendu. Sekcja 5 pokazuje jak Nginx
> ma teraz proxować `/api/` i `/socket.io/` do tego portu.
>
> **Uwaga:** `VITE_API_URL`/`VITE_WS_URL` nie są ustawiane — apka wylicza
> adres backendu z originu strony w runtime, więc zmiana IP/domeny serwera
> **nie wymaga** rebuildu frontendu. Jedyny wyjątek: jeśli świadomie
> ustawisz te zmienne (np. API na innym originie niż SPA), wtedy tak,
> zmiana wymaga `docker compose up -d --build frontend`.

---

## 5. Nginx

Zakładam, że Nginx jest już zainstalowany (sekcja 1). Jeśli nie:
```bash
sudo apt install -y nginx && sudo systemctl enable --now nginx
```

```bash
sudo nano /etc/nginx/sites-available/infrapilot
```

```nginx
server {
    listen 80;
    server_name _;

    # Nie ujawniaj wersji Nginx w nagłówkach/stronach błędów.
    server_tokens off;

    # Backend dopuszcza uploady do 200MB (instalator agenta) — domyślny
    # limit Nginx to 1MB i po cichu odrzuci większe requesty 413-ką.
    client_max_body_size 210m;

    # Socket.IO (żywe aktualizacje ticketów) — WebSocket upgrade musi iść
    # PRZED ogólnym /api/, bo /socket.io/ nie mieści się pod tamtym
    # prefiksem i backend nasłuchuje na tej dokładnej ścieżce.
    location /socket.io/ {
        proxy_pass         http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;   # długo żyjące połączenie WS
    }

    # Backend API — trailing slash w obu miejscach obcina prefiks /api/,
    # więc /api/devices trafia do backendu jako /devices (bez zmian w kodzie
    # backendu — tam nie ma globalnego prefiksu /api).
    location /api/ {
        proxy_pass         http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Frontend (SPA)
    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/infrapilot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default      # usuń domyślny — ważne!
sudo nginx -t && sudo systemctl reload nginx
```

> **Pułapka:** Jeśli masz więcej niż jeden plik w `sites-enabled` z `listen 80`,
> Nginx może serwować zły serwer. Sprawdź: `ls /etc/nginx/sites-enabled/`
>
> **Pułapka:** kolejność `location` ma znaczenie tylko dla dopasowań
> prefiksowych o tej samej specyficzności — Nginx i tak wybiera najdłuższy
> pasujący prefiks, ale trzymanie `/socket.io/` i `/api/` przed `/` w pliku
> jest czytelniejsze i zgodne z konwencją reszty configu.

---

## 6. Uruchomienie

```bash
cd /opt/infrapilot
docker compose up -d --build

# Sprawdź status
docker compose ps

# Logi backendu
docker compose logs api --tail=50

# Test backendu (bezpośrednio na kontenerze, z hosta — OK bo 127.0.0.1)
curl http://localhost:3000/health

# Test frontendu (bezpośrednio na kontenerze, z hosta)
curl http://localhost:8080

# Test właściwej ścieżki produkcyjnej — przez Nginx, tak jak widzi to przeglądarka
curl http://localhost/
curl http://localhost/api/health

# Backend NIE powinien być osiągalny z zewnątrz po :3000 — uruchom to z
# INNEJ maszyny w sieci (nie z samego serwera) i potwierdź, że failuje:
#   curl http://192.168.1.41:3000/health   →  connection refused/timeout
```

Aplikacja dostępna na `http://192.168.1.41`.

---

## 7. Dodawanie kolejnych użytkowników po pierwszym deployu

Bootstrap z sekcji 3 (`ADMIN_EMAIL`) tworzy dokładnie **jedno** konto — pierwszego
admina, i tylko raz, przy starcie na pustej tabeli `users`. Dla każdej kolejnej
osoby samo dodanie jej w PropelAuth **nie wystarczy** — appka nie ma
auto-provisioningu (JIT). Konto trzeba spiąć w dwóch miejscach: PropelAuth i
lokalna baza InfraPilot.

**Co się dzieje, jeśli ktoś ma konto w PropelAuth, ale nie ma lokalnego rekordu:**
- loguje się bez problemu (token PropelAuth jest ważny),
- część endpointów bez wymogu roli zwróci dane niepoprawnie — po cichu, bez
  błędu (błędne scope'owanie, bo backend nie może rozwiązać lokalnego id),
- każda akcja wymagająca uprawnień (admin, historia, itp.) zwróci
  `403 Forbidden — User context missing`.

**Prawidłowa ścieżka — Settings > Users, dowolna kolejność:**
1. Dodaj osobę po mailu w Settings > Users. Przy zapisie aplikacja sama
   próbuje dopasować istniejące konto PropelAuth po tym adresie.
2. Jeśli konta w PropelAuth jeszcze nie ma — w panelu użytkownika kliknij
   **Provision**: appka utworzy je automatycznie (tymczasowe hasło) i od razu
   spina oba konta.
3. Jeśli konto w PropelAuth już istnieje (dodane wcześniej ręcznie w panelu
   PropelAuth) — kliknij **Link by email** zamiast Provision.
4. Status widać w panelu użytkownika: *Not linked* / *Linked* / *Broken* —
   "Broken" oznacza, że zapisany link wskazuje na konto, które już nie
   istnieje w PropelAuth (np. usunięte tam ręcznie).

> **Pułapka:** import z AD/M365 (Settings > Active Directory / M365) też tylko
> **próbuje** dopasować po mailu przy imporcie — jeśli maile się nie zgadzają
> (inny alias, literówka), link trzeba dopiąć ręcznie jak wyżej, inaczej
> zaimportowana osoba zostaje z niedziałającym kontem mimo że widnieje w liście.

---

## 8. Aktualizacja aplikacji

```bash
cd /opt/infrapilot
git pull

# Pełny rebuild (zmiany w kodzie)
docker compose up -d --build

# Tylko restart bez rebuild (zmiana .env)
docker compose restart api
```

---

## 9. Znane problemy i rozwiązania

### Backend nie startuje — `relation does not exist`

**Przyczyna:** `MailService.onModuleInit` odpytuje bazę zanim TypeORM skończy synchronizację.  
**Status:** Naprawione w `backend/src/services/mail.service.ts` — błąd jest łapany i app startuje w trybie stub.  
**Jeśli wróci:** Zrestartuj kontener — tabele powinny już istnieć po pierwszym uruchomieniu.

### 502 Bad Gateway na porcie 80

**Przyczyna:** Frontend kontener nie działa lub Nginx wskazuje na zły port.  
**Diagnoza:**
```bash
docker compose ps
curl http://localhost:8080
ls /etc/nginx/sites-enabled/
```
**Rozwiązanie:** Upewnij się że tylko jeden plik jest w `sites-enabled` i wskazuje na port 8080.

### CORS błędy w przeglądarce

**Przyczyna:** `CORS_ORIGINS` w `.env` ustawione na `*` lub złą domenę — albo
frontend i API nie są już tym samym originem (np. ktoś otworzył apkę bezpośrednio
po `:8080`, z pominięciem Nginx).  
**Rozwiązanie:** Ustaw dokładny origin, pod którym faktycznie otwierasz apkę w
przeglądarce, bez trailing slash i bez portu (bo teraz wszystko idzie przez Nginx
na 80/443):
```env
CORS_ORIGINS=http://192.168.1.41
```
Potem: `docker compose restart api` (bez rebuild).

### Dane nie ładują się / socket nie łączy po zmianie IP lub domeny serwera

Domyślnie (bez ustawionych `VITE_API_URL`/`VITE_WS_URL`) apka wylicza adres
backendu z originu strony w runtime — zmiana IP/domeny **nie wymaga** żadnej
akcji, sam frontend się do niej dostosuje.

**Jeśli mimo to nie działa:** sprawdź czy w `docker-compose.yml` ktoś
świadomie nie ustawił `VITE_API_URL`/`VITE_WS_URL` na sztywno (np. bo API ma
być serwowane z innego originu niż SPA) — wtedy te dwie zmienne faktycznie
są baked-in podczas buildu i zmiana IP/domeny wymaga ich edycji i:
```bash
docker compose up -d --build frontend
```

### Ticket live-update (Socket.IO) nie łączy się mimo że reszta apki działa

**Przyczyna:** albo `VITE_WS_URL` nie jest ustawione (domyślnie leci na
`http://localhost:3000`, czyli maszynę *klienta*, nie serwera — sprawdź w
DevTools → Network → WS, do jakiego hosta faktycznie próbuje się połączyć),
albo w Nginx brakuje bloku `location /socket.io/` z nagłówkami
`Upgrade`/`Connection: upgrade` (sekcja 5) — bez nich handshake WebSocket
dostaje 400/502 zamiast przejść.  
**Diagnoza:** `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://192.168.1.41/socket.io/?EIO=4&transport=websocket` — powinno zwrócić `101 Switching Protocols`, nie 404/502.

### Agent (Windows/macOS/Linux) nie może się zarejestrować po zmianie architektury

**Przyczyna:** `AGENT_PUBLIC_BASE_URL` w `.env` nadal wskazuje bezpośrednio
na `:3000` zamiast na Nginx + `/api`. Snippet instalacyjny generowany w Settings >
Agent ma wtedy zaszyty zły adres.  
**Rozwiązanie:** Ustaw `AGENT_PUBLIC_BASE_URL=http://192.168.1.41/api`,
`docker compose restart api`, i wygeneruj nowy snippet/token (stare snippety mają
stary adres zaszyty na stałe, wygenerowane wcześniej pliki instalacyjne trzeba
pobrać na nowo).

### Requesty XHR blokowane przez CSP mimo `'self'` w `connect-src`

**Objaw:** w konsoli przeglądarki (zwłaszcza Edge) `Connecting to 'http://IP/api/...'
violates the following Content Security Policy directive: "connect-src 'self'
https: wss: ws: http://IP/api"` — mimo że `'self'` teoretycznie powinno pokrywać
każdy request do tego samego originu.  
**Przyczyna:** ktoś ręcznie dopisał `VITE_API_URL`/`VITE_WS_URL` jako build-arg w
`docker-compose.yml` (domyślnie ich tam nie ma, sekcja 4). Jawny wpis hosta ze
ścieżką bez końcowego `/` w `connect-src` obok `'self'` potrafi wywołać taki
błąd w niektórych przeglądarkach.  
**Rozwiązanie:** usuń `VITE_API_URL`/`VITE_WS_URL` z `docker-compose.yml`
(nie są potrzebne — patrz sekcja 4), `docker compose up -d --build frontend`.

---

## 10. Przydatne komendy

```bash
# Wejście do bazy danych
docker compose exec db psql -U infrapilot -d InfraPilot

# Lista tabel
docker compose exec db psql -U infrapilot -d InfraPilot -c '\dt'

# Logi wszystkich serwisów
docker compose logs -f

# Restart pojedynczego serwisu
docker compose restart api

# Zatrzymanie wszystkiego (dane w volumes są zachowane)
docker compose down

# Zatrzymanie z usunięciem danych (!)
docker compose down -v
```
