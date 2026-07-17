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

---

## 2. Struktura plików na serwerze

```
/opt/infrapilot/
├── docker-compose.yml        ← główny plik (frontend + backend + db)
├── .env                      ← zmienne DB i VITE dla docker-compose
├── backend/
│   ├── .env                  ← zmienne backendu (DB, CORS, klucze)
│   └── src/...
└── frontend/
    └── src/...
```

Skopiuj projekt:
```bash
git clone <repo-url> /opt/infrapilot
# lub rsync z lokalnej maszyny:
# rsync -avz --exclude node_modules --exclude dist ./  user@server:/opt/infrapilot/
```

---

## 3. Konfiguracja

### `/opt/infrapilot/.env` (zmienne dla docker-compose na poziomie root)

```env
DB_USERNAME=infrapilot
DB_PASSWORD=<silne-haslo>
DB_NAME=InfraPilot
VITE_AUTH_URL=https://<tenant>.propelauthtest.com
```

### `/opt/infrapilot/backend/.env`

> **Pierwszy deploy:** ustaw `ADMIN_EMAIL` na swój email z PropelAuth. Przy starcie aplikacja automatycznie stworzy konto admina jeśli baza jest pusta. Po pierwszym uruchomieniu możesz tę wartość usunąć.

```env
# PropelAuth
PROPELAUTH_AUTH_URL=https://<tenant>.propelauthtest.com
PROPELAUTH_API_KEY=<klucz>

# Baza danych
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=infrapilot
DB_PASSWORD=<silne-haslo>
DB_NAME=InfraPilot
DB_SCHEMA=public

# Szyfrowanie — wygeneruj: openssl rand -hex 32
# Zgubienie tego klucza = trwała utrata dostępu do wszystkich zaszyfrowanych
# sekretów (hasło bind AD, dane SSH urządzeń, SMTP). Trzymaj kopię offline
# (menedżer haseł), nie tylko w tym pliku na serwerze.
ENCRYPTION_KEY=<32-znakowy-hex>

# CORS — origin, z którego przeglądarka serwuje frontend (bez trailing
# slash, bez portu — Nginx teraz proxuje wszystko pod jednym originem,
# więc to i tak głównie obrona w głąb dla wywołań spoza przeglądarki)
CORS_ORIGINS=http://192.168.1.41

# Ufaj nagłówkowi X-Forwarded-For tylko dlatego, że Nginx faktycznie stoi
# przed tą apką jako reverse proxy (sekcja 5). Bez tego rate-limiting i
# logi widziałyby jeden IP (Nginx) dla wszystkich requestów; z tym ustawione
# na 'true' bez realnego proxy przed apką ktoś mógłby podszyć się pod IP
# nagłówkiem i ominąć limity — więc włączaj tylko razem z Nginx z sekcji 5.
TRUST_PROXY=true

# Baza URL wpiekana w każdy snippet instalacyjny agenta (Windows/macOS/
# Linux) z Settings > Agent. Musi wskazywać na Nginx (ten sam origin co
# CORS_ORIGINS) + prefiks /api — bo agenci też teraz idą przez proxy, nie
# bezpośrednio na :3000. Bez tego URL bierze się z nagłówka Host żądania
# admina — ryzyko wpieczenia złego/nieTLS adresu przez pomyłkę.
AGENT_PUBLIC_BASE_URL=http://192.168.1.41/api

# Wymuszaj MFA na wrażliwych modułach (eksport audytu, RODO, legal hold,
# retencja, sync AD, SMTP, M365, compliance, CVE, fleet). Zostawienie
# puste/inne niż 'true' wyłącza wymuszanie MFA w całej apce.
MFA_REQUIRED=true

# TypeORM — true tylko przy pierwszym deployu na świeżą bazę,
# potem zmień na false i używaj migracji
TYPEORM_SYNCHRONIZE=true

# Pierwszy admin — email musi zgadzać się z kontem w PropelAuth.
# Po pierwszym uruchomieniu można usunąć (działa tylko gdy users jest pusta).
ADMIN_EMAIL=twoj@email.com

# Serwer
PORT=3000
NODE_ENV=production

# SMTP (opcjonalne)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM_ADDRESS=infrapilot@localhost
```

Generowanie ENCRYPTION_KEY:
```bash
openssl rand -hex 32
```

---

## 4. Docker Compose (root)

Plik `/opt/infrapilot/docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - ./backend/.env
    environment:
      DB_HOST: db
      DB_PORT: "5432"
      NODE_ENV: production
      PORT: "3000"
    volumes:
      - uploads:/app/uploads
    ports:
      - "127.0.0.1:3000:3000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://192.168.1.41/api
        VITE_WS_URL: http://192.168.1.41
        VITE_AUTH_URL: ${VITE_AUTH_URL:-}
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"

volumes:
  pgdata:
  uploads:
```

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
> **Uwaga:** `VITE_API_URL` i `VITE_WS_URL` są wbudowane w bundle JavaScript
> podczas buildu. Jeśli zmienisz IP/domenę serwera, musisz przebudować obraz
> frontendu (`docker compose up -d --build frontend`).

---

## 5. Nginx

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

## 7. Aktualizacja aplikacji

```bash
cd /opt/infrapilot
git pull

# Pełny rebuild (zmiany w kodzie)
docker compose up -d --build

# Tylko restart bez rebuild (zmiana .env)
docker compose restart api
```

---

## 8. Znane problemy i rozwiązania

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

**Przyczyna:** `CORS_ORIGINS` w `backend/.env` ustawione na `*` lub złą domenę — albo
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

**Przyczyna:** `VITE_API_URL` i `VITE_WS_URL` są baked-in podczas buildu frontendu.  
**Rozwiązanie:** Zmień oba w `docker-compose.yml` i przebuduj frontend:
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

**Przyczyna:** `AGENT_PUBLIC_BASE_URL` w `backend/.env` nadal wskazuje bezpośrednio
na `:3000` zamiast na Nginx + `/api`. Snippet instalacyjny generowany w Settings >
Agent ma wtedy zaszyty zły adres.  
**Rozwiązanie:** Ustaw `AGENT_PUBLIC_BASE_URL=http://192.168.1.41/api`,
`docker compose restart api`, i wygeneruj nowy snippet/token (stare snippety mają
stary adres zaszyty na stałe, wygenerowane wcześniej pliki instalacyjne trzeba
pobrać na nowo).

---

## 9. Przydatne komendy

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
