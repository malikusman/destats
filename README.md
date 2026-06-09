# NetApp Storage Monitoring Dashboard

A single-pane-of-glass web dashboard for the **uspdc-nac01** NetApp ONTAP cluster (4 nodes, Hillsboro, OR DC). It visualizes cluster health, capacity and storage efficiency, per-aggregate and per-SVM usage, network interfaces (LIFs), and the EMS event log — all served by the read-only `scorpius-netapp-ingestion-api` at `http://10.0.65.40:8080`.

Built with Vite, React 18, TypeScript (strict), Tailwind CSS, TanStack Query, Recharts, and React Router. Read-only: no auth, no writes — every screen is fetch JSON, render, auto-refresh.

## Running it

The API lives on an internal network. The browser never talks to it directly — all requests go through a same-origin `/api-proxy` prefix that is reverse-proxied to the API (Vite in dev, Nginx in the container). This avoids CORS and mixed-content issues without any code changes between environments.

### 1. Local dev (Vite proxy)

```sh
# Be connected to the VPN so 10.0.65.40 is routable, then:
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). `vite.config.ts` proxies `/api-proxy/*` to `http://10.0.65.40:8080/*`.

### 2. Container (Nginx)

```sh
# The Docker host must be able to reach 10.0.65.40 (VPN / Tailscale / WireGuard), then:
docker compose up --build
```

Open `http://localhost:8088`. Nginx serves the built SPA and proxies `/api-proxy/` to the API.

## Pointing at a different API host

- **Dev:** change the proxy `target` in `vite.config.ts`, or set `VITE_API_BASE_URL` in a `.env` file (see `.env.example`) to a directly reachable API base URL.
- **Container:** set the `API_TARGET` environment variable — no rebuild needed:

```sh
API_TARGET=http://other-host:8080 docker compose up
```

## TDK server deployment (current)

The dashboard runs on the internal server `ussjc-scps01.invcorp.invensense.com` (10.0.65.19), which sits inside the network and reaches the NetApp API directly — viewers only need to be on the VPN/internal network.

- **URL:** `http://10.0.65.19:8088` (or `http://ussjc-scps01.invcorp.invensense.com:8088`)
- **Location on server:** `/opt/scorpius/destats`
- **Compose plugin:** persisted at `/opt/scorpius/.docker/cli-plugins` (use `export DOCKER_CONFIG=/opt/scorpius/.docker`; the `/tmp/.docker` copy is wiped on reboot)
- The container has `restart: unless-stopped`, so it comes back automatically after a server reboot.

To update after pushing changes to GitHub:

```sh
ssh <user>@ussjc-scps01.invcorp.invensense.com
export DOCKER_CONFIG=/opt/scorpius/.docker
cd /opt/scorpius/destats
git pull && docker compose up --build -d
```

## Deployment recap

- **Local laptop:** `npm run dev` or the container; works whenever your VPN is connected.
- **Internal server:** run the same container on a host inside the network — viewers don't need their own VPN.
- **DigitalOcean / external server:** run the container there and join the droplet to the internal network with Tailscale or WireGuard so it can reach `10.0.65.40`. Front it with HTTPS and add authentication before exposing it publicly — the app and the API currently have none.

## Screens

- **Overview (`/`)** — the always-open screen: KPI tiles (cluster health, nodes/aggregates/interfaces up, volumes online, used capacity %, open errors+alerts), a cluster capacity donut, per-aggregate fill bars against the 96% full threshold, an EMS severity donut with the five most recent errors, a cluster-activity timeline, and an ingestion-health strip showing the freshness of every data source.
- **Capacity & Efficiency (`/capacity`)** — stacked used/available bars per aggregate, volumes-per-SVM and used-capacity-per-SVM charts, a storage-efficiency comparison (dedupe/compression ratio with vs without snapshots), and a sortable top-15 fullest volumes table with fill bars and SnapMirror protection flags.
- **Aggregates (`/aggregates`)** — one card per aggregate with capacity fill vs threshold, volume count, owning node, disk type/count, RAID type, and both efficiency ratios.
- **Nodes (`/nodes`)** — one card per controller with model, ONTAP release, uptime, CPU/memory, HA partner with interconnect/takeover state, and green/red health flags for fans, PSUs, temperature, NVRAM battery, and the service processor.
- **Network (`/interfaces`)** — all 44 LIFs in a filterable table (scope, SVM) with IPs, state, enabled flag, home node/port, and service chips, plus scope/state counts up top.
- **Events (`/events`)** — the searchable EMS log: text search over messages and event names, severity multi-select, node filter, severity badges, expandable rows showing parameters and the full log line, an "Errors only" tab backed by the pre-filtered errors endpoint, and cursor-based "load more" pagination.

A global refresh-interval selector (Off / 15s / 30s / 60s / 5m, default 30s) in the top bar drives polling for all summary data, alongside a "last updated" indicator and a manual refresh button.

## Project layout

```
src/
  api/         fetch wrapper (envelope/error handling) + one module per endpoint group
  hooks/       TanStack Query hooks + global refresh-interval context
  types/       netapp.ts — typed contracts for every API response
  lib/         format.ts (bytes/TiB/percent/uptime/dates), status.ts (threshold → color)
  components/  KpiTile, CapacityBar, SeverityBadge, StatusDot, DataTable, ChartCard,
               LoadingSkeleton, ErrorState, EmptyState, Sidebar, TopBar, ClusterActivityCard
  pages/       Overview, Capacity, Aggregates, Nodes, Interfaces, Events
```

## Notes

- The cluster-metrics endpoint currently returns only timestamps (no IOPS/throughput/latency values). The Cluster Activity card renders any numeric series it finds; until then it shows the collection timeline as a sparkline instead of crashing or plotting NaN.
- Dynamic maps in the API (`svm_counts`, `state_counts`, `severity_counts`, `enabled_counts`) are treated as open `Record<string, number>` — no keys are hard-coded.
