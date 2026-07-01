# NetApp Dashboard — Deployment Guide

This document explains **step by step** how to deploy the NetApp Storage Monitoring Dashboard (`destats`) on the TDK internal server. It is written so someone with no prior deployment experience can follow it end to end.

If you only want a quick summary, see [README.md](README.md). Use **this file** when you need the full procedure.

---

## Table of contents

1. [What you are deploying](#1-what-you-are-deploying)
2. [Architecture (how the pieces connect)](#2-architecture-how-the-pieces-connect)
3. [Prerequisites checklist](#3-prerequisites-checklist)
4. [Phase 0 — Connect to the internal network (VPN)](#4-phase-0--connect-to-the-internal-network-vpn)
5. [Phase 1 — SSH into the TDK server](#5-phase-1--ssh-into-the-tdk-server)
6. [Phase 2 — Pre-flight checks on the server](#6-phase-2--pre-flight-checks-on-the-server)
7. [Phase 3 — Install Docker Compose (if missing)](#7-phase-3--install-docker-compose-if-missing)
8. [Phase 4 — Clone the repository](#8-phase-4--clone-the-repository)
9. [Phase 5 — Build and start the container](#9-phase-5--build-and-start-the-container)
10. [Phase 6 — Verify the deployment](#10-phase-6--verify-the-deployment)
11. [Phase 7 — Open the dashboard in a browser](#11-phase-7--open-the-dashboard-in-a-browser)
12. [Updating after code changes](#12-updating-after-code-changes)
13. [Changing the API target URL](#13-changing-the-api-target-url)
14. [Troubleshooting](#14-troubleshooting)
15. [Local development (optional)](#15-local-development-optional)
16. [Server reference](#16-server-reference)
17. [Files involved in deployment](#17-files-involved-in-deployment)

---

## 1. What you are deploying

You are deploying a **read-only web dashboard** that shows NetApp ONTAP cluster health and capacity for **`uspdc-nac01`**.

| Component | Role |
|---|---|
| **This app (destats)** | React single-page app served by Nginx in Docker |
| **scorpius-netapp-ingestion-api** | Separate backend at `http://10.0.65.40:8080` that polls NetApp and returns JSON |

The dashboard **does not talk to NetApp directly**. It only calls the ingestion API.

**Important:** The dashboard and the ingestion API are **two different services**. If the portal loads but shows no data, the dashboard may be fine while the ingestion API is down (see [Troubleshooting](#14-troubleshooting)).

---

## 2. Architecture (how the pieces connect)

```
Your browser (on VPN)
        │
        │  http://10.0.65.19:8088
        ▼
┌───────────────────────────────────────┐
│  TDK server: ussjc-scps01             │
│  Docker container: destats-web        │
│                                       │
│  Nginx inside container:              │
│    /           → React static files   │
│    /api-proxy/ → reverse proxy        │
└───────────────────┬───────────────────┘
                    │
                    │  http://10.0.65.40:8080
                    ▼
        scorpius-netapp-ingestion-api
                    │
                    ▼
              NetApp ONTAP cluster
              (uspdc-nac01)
```

**Why `/api-proxy`?** Browsers block cross-origin API calls (CORS). The app always requests `/api-proxy/...` on the **same host** as the dashboard. Nginx (in Docker) forwards those requests to the real API. No code changes are needed between your laptop, the TDK server, or Docker.

---

## 3. Prerequisites checklist

Before you start, confirm you have:

- [ ] **VPN access** to the internal TDK/InvenSense network (GlobalProtect)
- [ ] **SSH credentials** for the server (ask your team lead — do not commit passwords to git)
- [ ] **Git** installed on your laptop (to push code) — the server already has git
- [ ] **Docker** on the server (pre-installed on `ussjc-scps01`)
- [ ] The **ingestion API** running and reachable at `http://10.0.65.40:8080` (see pre-flight checks)

You do **not** need Node.js on the server for production deployment — Docker builds the app inside the container.

---

## 4. Phase 0 — Connect to the internal network (VPN)

The TDK server and the NetApp API are on a **private network**. You cannot SSH or open the dashboard without VPN.

### 4.1 Install GlobalProtect (first time only)

1. Open a browser and go to your company VPN portal (e.g. `https://uspdc-vpn.invensense.com`).
2. Log in with your TDK/InvenSense credentials.
3. Download and install **GlobalProtect** for your operating system.

### 4.2 Connect

1. Open the GlobalProtect app.
2. Enter the VPN portal address (e.g. `uspdc-vpn.invensense.com`).
3. Click **Connect** and sign in.
4. Wait until the VPN shows as connected (green/active).

> **Tip:** If SSH times out, VPN is almost certainly not connected.

---

## 5. Phase 1 — SSH into the TDK server

Open a terminal on your laptop (Terminal on Mac, PowerShell or Git Bash on Windows).

### 5.1 Connect

```bash
ssh cmiller_sn@ussjc-scps01.invcorp.invensense.com
```

Enter your password when prompted.

**Expected:** You get a shell prompt. You may see:

```
Could not chdir to home directory /home/cmiller_sn: No such file or directory
$
```

That warning is **normal** on this server. You can still run commands.

### 5.2 (Recommended) Set up SSH key login

Password login works, but SSH keys make repeat deployments easier.

**On your laptop** (one time):

```bash
# Generate a key if you don't already have one
ssh-keygen -t ed25519 -C "your.email@company.com"

# Copy your public key to the server (enter password once)
ssh-copy-id cmiller_sn@ussjc-scps01.invcorp.invensense.com
```

After this, `ssh cmiller_sn@ussjc-scps01.invcorp.invensense.com` should connect without a password.

> **Note:** If `/home/cmiller_sn` did not exist, an admin may need to create it and add your key to `~/.ssh/authorized_keys` once (requires `sudo` on the server).

---

## 6. Phase 2 — Pre-flight checks on the server

Run these **on the server** after SSH. Each check explains what “good” looks like.

### 6.1 Docker is installed

```bash
docker --version
```

**Good:** `Docker version 29.x` (or similar).

### 6.2 The ingestion API is reachable

This is the **most important check**. If this fails, the dashboard will load but show **no data**.

```bash
curl -s --max-time 10 http://10.0.65.40:8080/health
```

**Good:** JSON like:

```json
{"ok":true,"service":"scorpius-netapp-ingestion-api","time":"..."}
```

**Bad:** `Connection refused` or timeout → the ingestion API is down or moved. **Stop here** and ask whoever runs `scorpius-netapp-ingestion-api` to restart it or give you the new URL (see [Section 13](#13-changing-the-api-target-url)).

### 6.3 Port 8088 is free

The dashboard uses host port **8088**.

```bash
ss -ltn | grep 8088 || echo "Port 8088 is free"
```

**Good:** No output, or the message `Port 8088 is free`.

**Bad:** Another process is already using 8088 — pick a different port in `docker-compose.yml` or stop the conflicting service.

### 6.4 You can write to the deploy directory

```bash
ls -ld /opt/scorpius
touch /opt/scorpius/.writetest && rm /opt/scorpius/.writetest && echo "OK"
```

**Good:** `OK`

---

## 7. Phase 3 — Install Docker Compose (if missing)

Docker is installed on the server, but the **`docker compose`** plugin may live under `/tmp/.docker`, which is **wiped on reboot**. Use a **persistent** location.

Run on the server:

```bash
# Create persistent Docker config directory
mkdir -p /opt/scorpius/.docker/cli-plugins

# If compose already exists in /tmp, copy it; otherwise download it
if [ -f /tmp/.docker/cli-plugins/docker-compose ]; then
  cp /tmp/.docker/cli-plugins/docker-compose /opt/scorpius/.docker/cli-plugins/
else
  wget -O /opt/scorpius/.docker/cli-plugins/docker-compose \
    "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64"
fi

chmod +x /opt/scorpius/.docker/cli-plugins/docker-compose

# Tell Docker to use this config (run this every SSH session, or add to your profile)
export DOCKER_CONFIG=/opt/scorpius/.docker

docker compose version
```

**Good:** `Docker Compose version v2.24.0` (or similar).

> **Remember:** Run `export DOCKER_CONFIG=/opt/scorpius/.docker` at the start of every new SSH session before using `docker compose`.

---

## 8. Phase 4 — Clone the repository

Still on the server:

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker

# Clone (first time)
git clone https://github.com/malikusman/destats.git /opt/scorpius/destats

# Or, if already cloned, update instead:
# cd /opt/scorpius/destats && git pull
```

Verify:

```bash
ls /opt/scorpius/destats/Dockerfile
ls /opt/scorpius/destats/docker-compose.yml
```

Both files should exist.

---

## 9. Phase 5 — Build and start the container

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker
cd /opt/scorpius/destats
docker compose up --build -d
```

What this does:

1. **Build stage** — Uses Node 20 to run `npm ci` and `npm run build`, producing static files in `dist/`.
2. **Run stage** — Copies `dist/` into an Nginx image and starts it.
3. **`-d`** — Runs in the background.

First build takes **1–3 minutes**. Later rebuilds are faster.

Check the container is running:

```bash
docker ps --filter name=destats
```

**Good:**

```
destats-web-1   Up ...   0.0.0.0:8088->80/tcp
```

---

## 10. Phase 6 — Verify the deployment

Run these **on the server**:

### 10.1 API proxy works

```bash
curl -s http://localhost:8088/api-proxy/health
```

**Good:** Same JSON as the direct API health check in Phase 2.

### 10.2 Static app is served

```bash
curl -s http://localhost:8088/ | head -5
```

**Good:** HTML starting with `<!doctype html>`.

### 10.3 Client-side routes work (SPA fallback)

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8088/events
```

**Good:** `200` (not `404`).

### 10.4 Summary endpoint returns data

```bash
curl -s http://localhost:8088/api-proxy/api/netapp/summary | head -c 200
```

**Good:** JSON with `"ok": true` and a `"sources"` object.

If 10.1 fails with **502 Bad Gateway**, the ingestion API is unreachable from the container — see [Troubleshooting](#14-troubleshooting).

---

## 11. Phase 7 — Open the dashboard in a browser

On your laptop (with **VPN connected**), open:

| URL | Description |
|---|---|
| `http://10.0.65.19:8088` | By IP (recommended) |
| `http://ussjc-scps01.invcorp.invensense.com:8088` | By hostname |

**What you should see:**

- Sidebar: Overview, Capacity, Aggregates, Nodes, Network, Events
- KPI tiles with real numbers (e.g. Nodes **4/4**, Volumes **762**)
- Charts and tables filling in after a few seconds

**What indicates a problem:**

- Page loads but everything shows **0**, **—**, or **"Data unavailable"** → ingestion API issue, not the dashboard container.

---

## 12. Updating after code changes

When new code is pushed to GitHub:

**On the server:**

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker
cd /opt/scorpius/destats
git pull
docker compose up --build -d
```

**On your laptop** (to publish changes first):

```bash
git add .
git commit -m "Describe your change"
git push
```

Then run the server commands above.

---

## 13. Changing the API target URL

If the ingestion API moves to a different host or port, you do **not** need to change application code. Update the environment variable and restart:

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker
cd /opt/scorpius/destats

# Example: new API location
API_TARGET=http://NEW_HOST:8080 docker compose up -d
```

To make it permanent, create `/opt/scorpius/destats/.env` on the server:

```bash
API_TARGET=http://NEW_HOST:8080
```

Docker Compose reads `.env` automatically. Then:

```bash
docker compose up -d
```

Verify:

```bash
curl -s http://localhost:8088/api-proxy/health
```

---

## 14. Troubleshooting

### Portal loads but no data ("Data unavailable" / all zeros)

| Symptom | Likely cause | Fix |
|---|---|---|
| KPIs show 0/—, orange "Data unavailable" | Ingestion API down | `curl http://10.0.65.40:8080/health` on server — if connection refused, restart `scorpius-netapp-ingestion-api` or get new URL |
| 502 on `/api-proxy/*` | Same as above | Check `docker logs destats-web-1 --tail 50` for `Connection refused` to upstream |
| Works on laptop dev, not on server | Server can't reach API | Confirm API health from **server**, not just your laptop |

**Quick diagnosis on the server:**

```bash
# 1. Is the dashboard container up?
docker ps --filter name=destats

# 2. Is the upstream API up?
curl -s --max-time 5 http://10.0.65.40:8080/health

# 3. Does the proxy work?
curl -s --max-time 5 http://localhost:8088/api-proxy/health

# 4. Recent errors?
docker logs destats-web-1 --tail 30
```

### `docker compose: command not found`

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker
docker compose version
```

If still missing, repeat [Phase 3](#7-phase-3--install-docker-compose-if-missing).

### Port 8088 already in use

Edit `docker-compose.yml` and change the port mapping, e.g. `"8090:80"`, then:

```bash
docker compose up -d
```

### Container exits immediately

```bash
docker logs destats-web-1
docker compose up --build
```

(run without `-d` to see build/start errors in the foreground)

### Page works but refresh on `/events` gives 404

This should not happen with the current Nginx config (`try_files ... /index.html`). Rebuild:

```bash
docker compose up --build -d
```

### After server reboot

The dashboard container has `restart: unless-stopped` and should start automatically when Docker starts.

You may still need to:

1. Ensure Docker itself is running (usually automatic on this server).
2. Re-export `DOCKER_CONFIG` if you run compose commands manually:

   ```bash
   export DOCKER_CONFIG=/opt/scorpius/.docker
   ```

Other services on this box (e.g. Scorpius RAG Django/React dev servers) are **not** managed by this compose file and may need manual restart after reboot.

---

## 15. Local development (optional)

For development on your **laptop** (not required for TDK production deploy):

### Requirements

- Node.js 20+
- VPN connected (so `10.0.65.40` is reachable)

### Steps

```bash
git clone https://github.com/malikusman/destats.git
cd destats
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api-proxy/*` to `http://10.0.65.40:8080` (see [vite.config.ts](vite.config.ts)).

Optional: copy `.env.example` to `.env` if you need to override `VITE_API_BASE_URL`.

### Local Docker (test container on laptop)

```bash
docker compose up --build
```

Open `http://localhost:8088`.

---

## 16. Server reference

| Item | Value |
|---|---|
| **Server hostname** | `ussjc-scps01.invcorp.invensense.com` |
| **Server IP** | `10.0.65.19` |
| **SSH user** | `cmiller_sn` (or your assigned account) |
| **Deploy path** | `/opt/scorpius/destats` |
| **Dashboard URL** | `http://10.0.65.19:8088` |
| **Container name** | `destats-web-1` |
| **Host port → container** | `8088 → 80` |
| **Ingestion API** | `http://10.0.65.40:8080` |
| **GitHub repo** | `https://github.com/malikusman/destats` |
| **Docker config (persistent)** | `/opt/scorpius/.docker` |

### Server quirks (TDK / ussjc-scps01)

| Quirk | What to do |
|---|---|
| Default shell may be `sh`, not `bash` | Use `. script.sh` instead of `source script.sh` |
| `/home/cmiller_sn` may not exist initially | Use `/opt/scorpius` for persistent files |
| `/tmp` is wiped on reboot | Do **not** store Docker Compose plugin only under `/tmp/.docker` |
| No sudo for some users | Deploy uses Docker only — no root required if you're in the `docker` group |

---

## 17. Files involved in deployment

| File | Purpose |
|---|---|
| [Dockerfile](Dockerfile) | Multi-stage build: Node builds app → Nginx serves it |
| [docker-compose.yml](docker-compose.yml) | Defines `web` service, port 8088, `API_TARGET` env |
| [nginx.conf.template](nginx.conf.template) | Nginx: SPA routing + `/api-proxy/` reverse proxy |
| [.dockerignore](.dockerignore) | Keeps `node_modules` and `.git` out of the image |
| [.env.example](.env.example) | Documents `VITE_API_BASE_URL` for local dev |
| [vite.config.ts](vite.config.ts) | Dev-only proxy to the ingestion API |

---

## Quick command cheat sheet

**First-time deploy (on server):**

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker
curl -s http://10.0.65.40:8080/health          # must succeed first
git clone https://github.com/malikusman/destats.git /opt/scorpius/destats
cd /opt/scorpius/destats
docker compose up --build -d
curl -s http://localhost:8088/api-proxy/health  # verify
```

**Update deploy:**

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker
cd /opt/scorpius/destats && git pull && docker compose up --build -d
```

**Stop dashboard:**

```bash
export DOCKER_CONFIG=/opt/scorpius/.docker
cd /opt/scorpius/destats && docker compose down
```

---

## Security notes

- The dashboard has **no authentication**. It is intended for use on the **internal network / VPN only**.
- Do **not** expose port 8088 to the public internet without HTTPS and an auth layer in front.
- Do **not** commit passwords, VPN credentials, or `.env` files with secrets to git.
- Rotate credentials if they were ever shared in chat or email.

---

## Getting help

| Problem | Who / what |
|---|---|
| Dashboard container won't start | Check `docker logs destats-web-1`; re-read Phases 5–6 |
| Ingestion API down (`10.0.65.40:8080`) | Team running **scorpius-netapp-ingestion-api** |
| VPN / SSH access | IT / your team lead |
| Application bugs or feature requests | GitHub issues on `malikusman/destats` |

---

*Last updated: June 2026 — reflects deployment to `ussjc-scps01` at `/opt/scorpius/destats`.*
