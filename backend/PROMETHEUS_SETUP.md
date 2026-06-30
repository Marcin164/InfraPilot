# Prometheus setup (backend)

Jak dodać monitoring Prometheus do tej appki (metryki API + Postgresa) od zera, na nowej maszynie / w nowym projekcie.

## Co się składa na ten setup

1. **Metryki appki** — pakiet `@willsoto/nestjs-prometheus` w NestJS, wystawia `GET /metrics`.
2. **Metryki Postgresa** — kontener `prometheuscommunity/postgres-exporter`, wystawia `:9187/metrics`.
3. **Serwer Prometheus** — kontener `prom/prometheus`, scrape'uje oba powyższe i przechowuje dane.
4. *(opcjonalnie)* Grafana do wizualizacji.

## Krok po kroku

### 1. Backend — wystaw `/metrics`

```bash
npm install @willsoto/nestjs-prometheus
```

W `app.module.ts`:

```ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    // ...
    PrometheusModule.register(),
  ],
})
```

Nic więcej nie trzeba konfigurować — domyślnie leci pod `/metrics` (bez prefiksu, chyba że masz `setGlobalPrefix` w `main.ts`) i zawiera domyślne metryki Node.js (event loop lag, heap, GC).

### 2. `docker-compose.yml` — dodaj exporter, Prometheus

```yaml
services:
  # ... istniejące db / api ...

  postgres_exporter:
    image: prometheuscommunity/postgres-exporter
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATA_SOURCE_NAME: "postgresql://${DB_USERNAME}:${DB_PASSWORD}@db:5432/${DB_NAME}?sslmode=disable"
    ports:
      - "127.0.0.1:9187:9187"

  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    depends_on:
      - api
      - postgres_exporter
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"

volumes:
  # ... istniejące ...
  prometheus_data:
```

Wszystkie porty bindowane na `127.0.0.1` — nic nie wystawiamy na sieć LAN.

### 3. `prometheus.yml` (obok docker-compose.yml)

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'infrapilot-api'
    static_configs:
      - targets: ['api:3000']     # nazwa serwisu z docker-compose, nie localhost
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres_exporter:9187']
```

### 4. Odpal i zweryfikuj

```bash
docker compose up -d --remove-orphans
```

`--remove-orphans` jest istotny — patrz pułapka #1 niżej.

Sprawdź:
- `http://localhost:9090/targets` → oba joby (`infrapilot-api`, `postgres`) mają być `UP`.
- `http://localhost:3000/metrics` → surowy output metryk appki.

### 5. Grafana — z auto-provisioningiem (zero klikania w UI)

```yaml
  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    depends_on:
      - prometheus
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    ports:
      - "127.0.0.1:3001:3000"
```

Dodaj `grafana_data:` do `volumes:` i `GRAFANA_ADMIN_PASSWORD=` do `.env`/`.env.example`.

**Datasource** — `grafana/provisioning/datasources/prometheus.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

**Dashboardy** — `grafana/provisioning/dashboards/dashboards.yml` (provider, ładuje wszystko z folderu `json/`):

```yaml
apiVersion: 1

providers:
  - name: default
    folder: ""
    type: file
    updateIntervalSeconds: 30
    options:
      path: /etc/grafana/provisioning/dashboards/json
```

Wrzuć tam gotowe dashboardy z grafana.com (np. **ID 9628** — Postgres Exporter):

```bash
curl -sL "https://grafana.com/api/dashboards/9628/revisions/latest/download" \
  -o grafana/provisioning/dashboards/json/postgres-exporter.json
```

**Ważne**: dashboardy ściągnięte z grafana.com mają w sobie placeholder `${DS_PROMETHEUS}` zamiast realnej nazwy datasource'a — przy imporcie przez UI Grafana pyta o to ręcznie, ale przy provisioningu plikowym nikt nie zapyta, więc trzeba podmienić ten placeholder na nazwę z `datasources/prometheus.yml` (u nas: `Prometheus`) przed wrzuceniem pliku do repo:

```bash
sed -i 's/\${DS_PROMETHEUS}/Prometheus/g' grafana/provisioning/dashboards/json/postgres-exporter.json
```

Po `docker compose up -d grafana` wejdź na `http://localhost:3001` (login `admin` / hasło z `GRAFANA_ADMIN_PASSWORD`) — datasource i dashboard już tam są, nic nie trzeba klikać.

Pierwszy start Grafany potrafi zająć 1-3 minuty — przy pierwszym uruchomieniu wykonuje kilkaset migracji wewnętrznej bazy SQLite. To jednorazowe, kolejne starty są natychmiastowe. Sprawdź gotowość przez `curl http://localhost:3001/api/health`.

## Pułapki, na które trafiliśmy

1. **Osierocone kontenery po zmianie nazwy serwisu w compose.** Jeśli kiedyś zmienisz nazwę serwisu w `docker-compose.yml` (np. `postgres` → `db`), stary kontener **nie znika sam** — zostaje i może dalej trzymać port hosta, blokując nowy serwis. Zawsze odpalaj `docker compose up -d --remove-orphans`, a jeśli coś nie startuje, sprawdź `docker compose ps -a` pod kątem kontenerów z nieistniejącą już nazwą serwisu.

2. **Port hosta zajęty przez coś spoza Dockera.** Na Windows łatwo mieć natywnie zainstalowany Postgres jako usługę systemową (`sc query state= all | findstr postgres`), który siedzi na `5432` i blokuje kontener `db`. Sprawdź `netstat -ano | findstr :5432` i zobacz, czyj to PID (`tasklist /fi "PID eq <pid>"`) zanim założysz, że problem jest w Dockerze.

3. **Docker Desktop musi faktycznie chodzić.** Błąd `unable to get image ... failed to connect to the docker API at npipe://./pipe/dockerDesktopLinuxEngine` = silnik nie wstał. Odpal Docker Desktop i poczekaj ~15-30s zanim odpalisz `docker compose`.

## Bezpieczeństwo

`/metrics` i `:9187` nie mają autoryzacji — OK dopóki są bindowane tylko na `127.0.0.1`. Jeśli kiedyś postawisz przed stackiem reverse proxy (nginx/traefik) wystawiony na zewnątrz, **nie** proxuj `/metrics` publicznie bez dodatkowej autoryzacji (np. basic auth na proxy).
