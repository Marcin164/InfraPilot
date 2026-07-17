# Deployment na GCP — InfraPilot (frontend + backend + Postgres + VPN do LAN)

Wariant wybrany: **jedna maszyna Compute Engine + Docker Compose** (ten sam
`docker-compose.yml` co w [DEPLOYMENT.md](DEPLOYMENT.md), tylko hostowany na
GCP) + **site-to-site VPN** między GCP a Twoją siecią lokalną, żeby
`pingMonitor.worker.ts` (ping urządzeń po `managementIp` co 5 minut, zob.
`backend/src/workers/pingMonitor.worker.ts:26`) faktycznie widział urządzenia
w LAN.

```
Internet ── HTTPS:443 ──► [VM e2-small, zewnętrzny static IP]
                              ├─ nginx :80  → frontend (statyczne pliki, Vite build)
                              ├─ api :3000  → backend (NestJS, Docker)
                              └─ db :5432   → Postgres (Docker, wolumen na dysku VM)
                                     │
                                     │  Cloud VPN (IPsec, tunel site-to-site)
                                     ▼
                         [Twój router/firewall lub strongSwan na LAN]
                                     │
                              Urządzenia w LAN (managementIp)
```

**Bez VPN backend nie dobije do urządzeń w Twojej sieci lokalnej** — kontener
w GCP jest w zupełnie innej sieci niż Twój LAN, więc ICMP ping po prostu nie
ma jak dotrzeć. Sekcja 3 pokazuje jak to połączyć.

---

## 0. Wymagania po Twojej stronie (LAN)

Site-to-site VPN wymaga urządzenia brzegowego po stronie lokalnej, które:
- ma publiczny adres IP (albo przekierowanie portów UDP 500, UDP 4500 i
  protokołu IP 50/ESP na urządzenie wewnątrz sieci),
- potrafi terminować tunel IPsec.

Dwie opcje:
- **Masz już firewall/router klasy biznesowej** (pfSense, OPNsense, MikroTik,
  UniFi Dream Machine, Fortigate...) — skonfigurujesz tunel w jego GUI, z tymi
  samymi parametrami co w sekcji 3.1 (adres peera, PSK, traffic selectors).
- **Nie masz** — postaw małą maszynę Linux (Raspberry Pi, mini PC, stary
  laptop) podłączoną do LAN i uruchom na niej `strongSwan` — przykładowa
  konfiguracja w sekcji 3.2. Ten box musi mieć port forwarding UDP
  500/4500 + ESP z routera ISP na siebie, albo siedzieć bezpośrednio na
  publicznym IP.

Jeśli żadna z tych opcji nie wchodzi w grę (np. NAT bez możliwości
przekierowania portów u ISP), VPN nie zadziała i ping-monitoring zostanie
ograniczony do urządzeń dostępnych z internetu — reszta tutoriala (hosting
appki + bazy) nadal ma sens, po prostu pomiń sekcję 3.

---

## 1. Wymagania wstępne

```bash
# Instalacja gcloud CLI (jeśli nie masz) — https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud projects create infrapilot-prod --name="InfraPilot"
gcloud config set project infrapilot-prod
gcloud billing projects link infrapilot-prod --billing-account=<TWOJE_BILLING_ACCOUNT_ID>

# Włącz potrzebne API
gcloud services enable compute.googleapis.com
```

Ustaw zmienne, które będą się powtarzać w komendach:

```bash
export PROJECT_ID=infrapilot-prod
export REGION=europe-central2
export ZONE=europe-central2-a
export VPC_NAME=infrapilot-vpc
export SUBNET_NAME=infrapilot-subnet
export SUBNET_RANGE=10.10.0.0/24
export LAN_CIDR=192.168.1.0/24        # Twoja sieć lokalna — dopasuj!
export PEER_PUBLIC_IP=<PUBLICZNE_IP_TWOJEGO_ROUTERA_LUB_STRONGSWAN_BOXA>
export VPN_PSK=$(openssl rand -base64 24)
echo "Zapisz gdzieś bezpiecznie PSK: $VPN_PSK"
```

`europe-central2` (Warszawa) — najniższe opóźnienia z Polski. Zmień jeśli
Twoja lokalizacja jest inna.

---

## 2. Sieć VPC i firewall

```bash
gcloud compute networks create $VPC_NAME --subnet-mode=custom

gcloud compute networks subnets create $SUBNET_NAME \
  --network=$VPC_NAME --region=$REGION --range=$SUBNET_RANGE

# SSH tylko przez IAP (Identity-Aware Proxy) — nie wystawiamy 22 na świat
gcloud compute firewall-rules create allow-iap-ssh \
  --network=$VPC_NAME --direction=INGRESS --action=ALLOW \
  --rules=tcp:22 --source-ranges=35.235.240.0/20

# HTTP/HTTPS dla świata
gcloud compute firewall-rules create allow-web \
  --network=$VPC_NAME --direction=INGRESS --action=ALLOW \
  --rules=tcp:80,tcp:443 --source-ranges=0.0.0.0/0

# Ruch z LAN (przez tunel VPN) do VM — ping, health checki z Twojej strony itp.
gcloud compute firewall-rules create allow-from-lan \
  --network=$VPC_NAME --direction=INGRESS --action=ALLOW \
  --rules=all --source-ranges=$LAN_CIDR
```

> **Pułapka:** GCP domyślnie **odrzuca cały ruch przychodzący** w custom-mode
> VPC. Jeśli zapomnisz reguły firewall dla konkretnego ruchu (np. VPN-owego),
> tunel się „podniesie” ale pakiety i tak nie przejdą — sprawdzaj
> `gcloud compute firewall-rules list --filter="network:$VPC_NAME"`.

---

## 3. Site-to-site VPN GCP ↔ LAN

Używamy **Classic Cloud VPN** (route-based, statyczne trasy) — prostsze niż
HA VPN, nie wymaga Cloud Routera ani BGP, wystarczy jeden tunel do jednego
publicznego IP po stronie LAN.

### 3.1 Strona GCP

```bash
# Statyczny IP dla bramy VPN
gcloud compute addresses create vpn-gw-ip --region=$REGION
export VPN_GW_IP=$(gcloud compute addresses describe vpn-gw-ip \
  --region=$REGION --format='value(address)')
echo "IP bramy VPN (podaj je na urządzeniu po stronie LAN jako peer): $VPN_GW_IP"

# Target VPN gateway
gcloud compute target-vpn-gateways create infrapilot-vpn-gw \
  --network=$VPC_NAME --region=$REGION

# Forwarding rules — ESP, UDP 500, UDP 4500 muszą trafiać do bramy
gcloud compute forwarding-rules create vpn-esp \
  --region=$REGION --ip-protocol=ESP --address=$VPN_GW_IP \
  --target-vpn-gateway=infrapilot-vpn-gw

gcloud compute forwarding-rules create vpn-udp500 \
  --region=$REGION --ip-protocol=UDP --ports=500 --address=$VPN_GW_IP \
  --target-vpn-gateway=infrapilot-vpn-gw

gcloud compute forwarding-rules create vpn-udp4500 \
  --region=$REGION --ip-protocol=UDP --ports=4500 --address=$VPN_GW_IP \
  --target-vpn-gateway=infrapilot-vpn-gw

# Tunel — traffic selectors ograniczają ruch do "GCP subnet <-> LAN subnet"
gcloud compute vpn-tunnels create tunnel-to-lan \
  --region=$REGION \
  --target-vpn-gateway=infrapilot-vpn-gw \
  --peer-address=$PEER_PUBLIC_IP \
  --shared-secret="$VPN_PSK" \
  --ike-version=2 \
  --local-traffic-selector=$SUBNET_RANGE \
  --remote-traffic-selector=$LAN_CIDR

# Trasa: pakiety do LAN_CIDR mają iść tunelem
gcloud compute routes create route-to-lan \
  --network=$VPC_NAME --destination-range=$LAN_CIDR \
  --next-hop-vpn-tunnel=tunnel-to-lan --next-hop-vpn-tunnel-region=$REGION
```

### 3.2 Strona LAN — strongSwan (jeśli nie masz gotowego firewalla)

Na maszynie Linux podłączonej do LAN:

```bash
sudo apt update && sudo apt install -y strongswan
```

`/etc/ipsec.conf`:

```
config setup
    charondebug="ike 1, knl 1, cfg 0"

conn gcp-infrapilot
    auto=start
    type=tunnel
    keyexchange=ikev2
    authby=secret
    left=%defaultroute
    leftid=<PUBLICZNE_IP_TEGO_BOXA_LUB_ROUTERA>
    leftsubnet=192.168.1.0/24          # = $LAN_CIDR
    right=<VPN_GW_IP z kroku 3.1>
    rightsubnet=10.10.0.0/24           # = $SUBNET_RANGE
    ike=aes256-sha256-modp2048!
    esp=aes256-sha256!
    keyingtries=%forever
    ikelifetime=1h
    lifetime=8h
    dpdaction=restart
    dpddelay=30s
```

`/etc/ipsec.secrets`:

```
<VPN_GW_IP z kroku 3.1> : PSK "wklej tu wartość $VPN_PSK"
```

```bash
sudo systemctl restart strongswan-starter
sudo ipsec statusall     # tunel powinien być ESTABLISHED
```

Jeśli masz zamiast tego pfSense/OPNsense/MikroTik/UniFi — użyj tych samych
parametrów (IKEv2, PSK, local/remote subnet, AES256-SHA256-MODP2048) w GUI
tworzenia tunelu IPsec.

### 3.3 Weryfikacja tunelu

```bash
gcloud compute vpn-tunnels describe tunnel-to-lan --region=$REGION \
  --format='value(status,detailedStatus)'
# Oczekiwane: ESTABLISHED
```

Ping z GCP do urządzenia w LAN sprawdzimy dopiero jak VM będzie gotowa
(krok 9) — na razie sam status tunelu wystarczy.

---

## 4. Maszyna wirtualna (Compute Engine)

```bash
gcloud compute addresses create infrapilot-web-ip --region=$REGION
export WEB_IP=$(gcloud compute addresses describe infrapilot-web-ip \
  --region=$REGION --format='value(address)')
echo "Publiczny IP appki: $WEB_IP"

gcloud compute instances create infrapilot-vm \
  --zone=$ZONE \
  --machine-type=e2-small \
  --network-interface=subnet=$SUBNET_NAME,address=$WEB_IP \
  --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB --boot-disk-type=pd-balanced \
  --tags=infrapilot-web
```

`e2-small` (2 GB RAM) wystarcza na frontend + backend + Postgres dla małej
instalacji. Jeśli baza urośnie, zmień na `e2-medium` (`gcloud compute
instances set-machine-type`, wymaga zatrzymania VM).

SSH przez IAP (bez otwartego portu 22 na świat):

```bash
gcloud compute ssh infrapilot-vm --zone=$ZONE --tunnel-through-iap
```

---

## 5. Docker na VM

Na VM (przez SSH z kroku 4):

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

## 6. Wdrożenie aplikacji

```bash
sudo mkdir -p /opt/infrapilot && sudo chown $USER:$USER /opt/infrapilot
git clone <repo-url> /opt/infrapilot
cd /opt/infrapilot
```

`/opt/infrapilot/.env` (root, dla docker-compose):

```env
DB_USERNAME=infrapilot
DB_PASSWORD=<silne-haslo>
DB_NAME=InfraPilot
VITE_AUTH_URL=https://<tenant>.propelauthtest.com
```

`/opt/infrapilot/backend/.env` — identycznie jak w
[DEPLOYMENT.md §3](DEPLOYMENT.md), z jedną różnicą: `CORS_ORIGINS` musi
wskazywać na publiczny adres/domenę tej VM:

```env
PROPELAUTH_AUTH_URL=https://<tenant>.propelauthtest.com
PROPELAUTH_API_KEY=<klucz>

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=infrapilot
DB_PASSWORD=<silne-haslo>
DB_NAME=InfraPilot
DB_SCHEMA=public

ENCRYPTION_KEY=<openssl rand -hex 32>

CORS_ORIGINS=https://<twoja-domena-lub-IP>

TYPEORM_SYNCHRONIZE=true   # tylko pierwszy deploy, potem false

ADMIN_EMAIL=twoj@email.com # usuń po pierwszym starcie

PORT=3000
NODE_ENV=production
```

`docker-compose.yml` (root) — ten sam wzorzec co w
[DEPLOYMENT.md §4](DEPLOYMENT.md), z `VITE_API_URL` wskazującym na
zewnętrzny adres tej VM (bo Vite zaszywa tę zmienną w bundle na etapie
builda):

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
        VITE_API_URL: https://<twoja-domena-lub-IP>
        VITE_AUTH_URL: ${VITE_AUTH_URL:-}
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"

volumes:
  pgdata:
  uploads:
```

---

## 7. Nginx + HTTPS

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/infrapilot`:

```nginx
server {
    listen 80;
    server_name twoja-domena.pl;   # albo _ jeśli zostajesz na gołym IP (bez HTTPS)

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
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Jeśli masz domenę wskazującą na `$WEB_IP` (rekord A w DNS — możesz też użyć
Cloud DNS, ale nie jest to wymagane), włącz HTTPS:

```bash
sudo certbot --nginx -d twoja-domena.pl
```

Bez domeny zostajesz na `http://<WEB_IP>` — działa, ale bez szyfrowania w
tranzycie; nie polecane dla czegokolwiek poza testem.

---

## 8. Start i weryfikacja

```bash
cd /opt/infrapilot
docker compose up -d --build

docker compose ps
docker compose logs api --tail=50

curl http://localhost:3000/health
curl http://localhost:8080

# Test właściwy: czy backend widzi urządzenie w LAN przez tunel VPN
docker compose exec api ping -c 3 <IP_URZADZENIA_W_LAN>
```

Ostatnia komenda to prawdziwy test całej układanki — jeśli to nie przechodzi,
sprawdź w kolejności: status tunelu (`gcloud compute vpn-tunnels describe`),
regułę `allow-from-lan`, i czy `iptables`/firewall na urządzeniu w LAN nie
blokuje ICMP od `$SUBNET_RANGE`.

Aplikacja dostępna pod `https://twoja-domena.pl` (albo `http://$WEB_IP`).

---

## 9. Backupy

Repo ma już gotowy plan i skrypty w [ops/backup/](ops/backup/) (RPO 24h,
szyfrowane bundle, S3 lub SSH jako miejsce docelowe) — użyj ich bez zmian,
tylko wskaż `BACKUP_S3_BUCKET` na bucket GCS (kompatybilny z S3 API) albo
skonfiguruj docelowy SSH host.

Dodatkowo, na poziomie GCP, warto mieć snapshoty dysku VM (całościowy
recovery, niezależnie od backupu logicznego bazy):

```bash
gcloud compute resource-policies create snapshot-schedule infrapilot-daily-snapshot \
  --region=$REGION \
  --daily-schedule --start-time=03:00 \
  --max-retention-days=14

gcloud compute disks add-resource-policies infrapilot-vm \
  --zone=$ZONE --resource-policies=infrapilot-daily-snapshot
```

---

## 10. Aktualizacja aplikacji

Identycznie jak w [DEPLOYMENT.md §7](DEPLOYMENT.md):

```bash
cd /opt/infrapilot
git pull
docker compose up -d --build
```

---

## 11. Koszty orientacyjne (europe-central2, ceny mogą się zmienić)

| Zasób | ~Koszt/mies. |
|---|---|
| VM e2-small (24/7) | ~13 USD |
| Dysk pd-balanced 30GB | ~4 USD |
| Static IP (w użyciu, przypięty do działającej VM) | 0 USD |
| Classic VPN tunnel (1 tunel) | ~36 USD |
| Egress do internetu | zależnie od ruchu, pierwsze GB w wielu regionach gratis |

Sprawdź aktualne stawki w [GCP Pricing Calculator] — link dodaj sam, tu
celowo nie zgaduję URL-i.

---

## 12. Typowe problemy specyficzne dla GCP

### Tunel VPN "ESTABLISHED" ale ping i tak nie przechodzi

**Przyczyna:** brak reguły firewall `allow-from-lan`, albo traffic selectors
(`--local-traffic-selector` / `--remote-traffic-selector`) nie pokrywają się
z rzeczywistymi zakresami po obu stronach.
**Diagnoza:** `gcloud compute firewall-rules list`, sprawdź czy
`leftsubnet`/`rightsubnet` w strongSwan dokładnie odpowiadają
`$LAN_CIDR`/`$SUBNET_RANGE`.

### VM nie ma dostępu do internetu mimo statycznego IP

**Przyczyna:** brak reguły firewall zezwalającej na ruch wychodzący (rzadkie,
domyślnie egress jest allow) albo źle przypisany `--address` przy tworzeniu
instancji.
**Rozwiązanie:** `gcloud compute instances describe infrapilot-vm --zone=$ZONE
--format='value(networkInterfaces[0].accessConfigs[0].natIP)'` — potwierdź że
to `$WEB_IP`.

### SSH przez IAP nie działa

**Przyczyna:** brakuje roli `roles/iap.tunnelResourceAccessor` na Twoim
koncie, albo reguła `allow-iap-ssh` nie istnieje.
**Rozwiązanie:**
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=user:twoj@email.com --role=roles/iap.tunnelResourceAccessor
```

### 502 Bad Gateway / CORS / brak danych po zmianie IP

Te trzy są identyczne jak w [DEPLOYMENT.md §8](DEPLOYMENT.md) — diagnostyka i
rozwiązania się nie zmieniają, zmienia się tylko gdzie jest maszyna.
