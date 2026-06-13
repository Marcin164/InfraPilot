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
ENCRYPTION_KEY=<32-znakowy-hex>

# CORS — dokładny origin frontendu (bez trailing slash)
CORS_ORIGINS=http://192.168.1.41

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
      - "3000:3000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://192.168.1.41:3000
        VITE_AUTH_URL: ${VITE_AUTH_URL:-}
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"

volumes:
  pgdata:
  uploads:
```

> **Uwaga:** `VITE_API_URL` jest wbudowane w bundle JavaScript podczas buildu.
> Jeśli zmienisz IP serwera, musisz przebudować obraz frontendu (`docker compose up -d --build frontend`).

---

## 5. Nginx

```bash
sudo nano /etc/nginx/sites-available/infrapilot
```

```nginx
server {
    listen 80;
    server_name _;

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

---

## 6. Uruchomienie

```bash
cd /opt/infrapilot
docker compose up -d --build

# Sprawdź status
docker compose ps

# Logi backendu
docker compose logs api --tail=50

# Test backendu
curl http://localhost:3000/health

# Test frontendu
curl http://localhost:8080
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

**Przyczyna:** `CORS_ORIGINS` w `backend/.env` ustawione na `*` lub złą domenę.  
**Rozwiązanie:** Ustaw dokładny origin frontendu bez trailing slash:
```env
CORS_ORIGINS=http://192.168.1.41
```
Potem: `docker compose restart api` (bez rebuild).

### Dane nie ładują się po zmianie IP serwera

**Przyczyna:** `VITE_API_URL` jest baked-in podczas buildu frontendu.  
**Rozwiązanie:** Zmień `VITE_API_URL` w `docker-compose.yml` i przebuduj frontend:
```bash
docker compose up -d --build frontend
```

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
