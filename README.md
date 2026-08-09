# Scorpius NetApp Monitor (`destats`)

Live operator dashboard for NetApp ONTAP storage health and the Scorpius incident platform.

- **NetApp telemetry** via `scorpius-netapp-ingestion-api` (`http://10.0.65.40:8080`)
- **Incidents / knowledge / learning / evaluation** via the platform Incident API
- **Live data only by default** — demo `INC-*` incidents and mock AI workflow are off unless explicitly enabled
- Cluster name and location are **derived from live nodes**, not hardcoded

Built with Vite, React 18, TypeScript, Tailwind CSS, TanStack Query, Recharts, and React Router. Read-only UI (no auth in this app).

---

## Docs

| Doc | Purpose |
|-----|---------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Full TDK server deploy (VPN, SSH, Docker, troubleshooting) |
| [docs/INCIDENT_API.md](docs/INCIDENT_API.md) | Incident Service API reference |
| [docs/PLATFORM_API_UI_MAP.md](docs/PLATFORM_API_UI_MAP.md) | Platform API → UI map |
| [docs/INCIDENT_API_BACKEND_GAPS.md](docs/INCIDENT_API_BACKEND_GAPS.md) | Backend gaps / acceptance asks (Khai + manager) |
| [docs/LIVE_INCIDENT_API_VERIFICATION.md](docs/LIVE_INCIDENT_API_VERIFICATION.md) | Live `:8003` API verification notes |
| [docs/LIVE_API_RESPONSE_AUDIT.md](docs/LIVE_API_RESPONSE_AUDIT.md) | Live GET audit: samples + UI shown vs unused fields |
| [docs/DEVELOPER_API_HANDOFFS.md](docs/DEVELOPER_API_HANDOFFS.md) | Developer PDF handoffs: Incident Service Epics 4/5/10/11 + Control Plane Epics 7/13/14 |
| [docs/DEVELOPER_API_LIVE_AUDIT.md](docs/DEVELOPER_API_LIVE_AUDIT.md) | Live curl verification of handoff APIs (status + response samples) |
| [docs/EPIC_4_5_10_11_INTEGRATION_AND_LIVE_RESPONSES.md](docs/EPIC_4_5_10_11_INTEGRATION_AND_LIVE_RESPONSES.md) | Epics 4/5/10/11: integrated vs not + live response samples |

---

## Architecture

```
Browser (VPN)
   │
   │  http://localhost:8088  or  http://10.0.65.19:8088
   ▼
Nginx in destats-web container
   ├── /              → React SPA
   ├── /api-proxy/    → API_TARGET        (ingestion, default 10.0.65.40:8080)
   └── /incident-api/ → INCIDENT_API_TARGET (platform incidents)
```

The browser never calls upstream hosts directly (CORS / same-origin).

---

## Quick start

### Local Vite (dev)

VPN required so `10.0.65.40` is reachable.

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api-proxy` and `/incident-api`.

### Local Docker

```sh
docker compose up --build
```

Open `http://localhost:8088`.

**On a machine that also serves the portal on `:8088`**, do **not** leave `INCIDENT_API_TARGET` pointing at `http://10.0.65.19:8088/incident-api` (self-proxy loop). Point at the incident service directly:

```sh
# .env next to docker-compose.yml
API_TARGET=http://10.0.65.40:8080
INCIDENT_API_TARGET=http://10.0.65.19:8003
```

Then:

```sh
docker compose up --build -d
```

---

## Environment

See [`.env.example`](.env.example).

| Variable | Default | Notes |
|----------|---------|--------|
| `API_TARGET` | `http://10.0.65.40:8080` | Ingestion upstream for Nginx |
| `INCIDENT_API_TARGET` | see compose | Platform upstream for Nginx — use `:8003` on the TDK host |
| `VITE_API_BASE_URL` | `/api-proxy` | Browser path (Vite) |
| `VITE_INCIDENT_API_BASE_URL` | `/incident-api` | Browser path (Vite) |
| `VITE_USE_MOCK_INCIDENTS=1` | off | Enables demo `INC-*` + mock AI tabs (offline only) |
| `VITE_USE_MOCK_KNOWLEDGE=1` | off | Forces mock knowledge instead of live retrieve |

Optional local incident mock:

```sh
docker compose --profile demo up --build
INCIDENT_API_TARGET=http://mock-api:3090 docker compose --profile demo up -d
```

---

## TDK server (production)

| Item | Value |
|------|--------|
| Host | `ussjc-scps01` / `10.0.65.19` |
| Portal URL | **http://10.0.65.19:8088** |
| Deploy tree | `/opt/scorpius/clone-agent-test-ui` |
| Compose config | `export DOCKER_CONFIG=/opt/scorpius/.docker` |
| Branch (current) | `feature/tdk-ui-filters-drilldown` |

> **Important:** `/opt/scorpius/destats` on this host is the **Scorpius RAG** repo, not this dashboard. Do not `git pull` portal code there.

### Update after pushing to GitHub

```sh
ssh cmiller_sn@ussjc-scps01.invcorp.invensense.com
export DOCKER_CONFIG=/opt/scorpius/.docker
cd /opt/scorpius/clone-agent-test-ui

git fetch origin
git checkout feature/tdk-ui-filters-drilldown
git pull origin feature/tdk-ui-filters-drilldown

# Avoid circular proxy on this host
cat > .env <<'EOF'
API_TARGET=http://10.0.65.40:8080
INCIDENT_API_TARGET=http://10.0.65.19:8003
EOF

docker compose -p destats up --build -d

curl -s http://localhost:8088/api-proxy/health
curl -s http://localhost:8088/incident-api/health
```

Viewers need VPN (or internal network) to open `http://10.0.65.19:8088`.

Full procedure: [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Screens

### NetApp Storage

| Route | What you get |
|-------|----------------|
| `/` Overview | Live KPIs, capacity, aggregate fill, EMS severity drill-down, degraded reasons, ingestion health |
| `/capacity` | Aggregates / SVMs / efficiency / fullest volumes |
| `/aggregates` | Per-aggregate cards |
| `/nodes` | Controllers, HA, health flags |
| `/interfaces` | LIFs table |
| `/events` | EMS log — **defaults to errors/alerts**; severity filters + noise hide |

### Scorpius Platform

| Route | What you get |
|-------|----------------|
| `/incidents` | Live Incident API list + clickable KPI filters |
| `/incidents/:id` | Overview (timeline, assets, recommendations, knowledge/learning panels). AI Reasoning / Planning tabs are greyed out until live APIs exist |
| `/knowledge` `/usecases` `/learning` `/evaluation` | Live platform APIs |
| `/system-status` | Live probes of ingestion + incident health (not simulated services) |

Top bar: cluster identity from nodes API, health badge from EMS/node/aggregate summaries, refresh interval.

---

## Project layout

```
src/
  api/                  ingestion + incident-service + scorpius modules
  hooks/                TanStack Query + refresh context
  lib/                  format, status, cluster-identity, data-source, adapters
  components/           KPI, charts, tables, Sidebar, TopBar, platform panels
  pages/                NetApp + Scorpius screens
  mocks/                Offline demo data (gated by VITE_USE_MOCK_*)
docs/                   API maps, verification, backend gaps
docker-compose.yml      web (+ optional mock-api profile)
DEPLOYMENT.md           TDK deploy guide
```

---

## Notes

- Cluster-metrics may only return timestamps; Cluster Activity renders what numeric series exist.
- Dynamic API maps (`severity_counts`, `state_counts`, …) are open `Record<string, number>` — no assumed keys.
- If Incidents shows “service temporarily unavailable” on the TDK host, check `INCIDENT_API_TARGET` is `:8003` (not `:8088/incident-api`).
