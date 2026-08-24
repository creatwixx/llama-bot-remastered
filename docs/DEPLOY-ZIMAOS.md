# Deploying Llama Bot to ZimaOS

Self-hosting the bot on a home server (old laptop running ZimaOS), with the
production data restored from a Railway dump.

Everything in this guide was validated end-to-end locally before being written:
image builds, database restore, migration behaviour, and trigger matching against
the real 21-emote dataset.

## Why this needs more than "one container"

This repo is **two** services, not one:

| Service | What it does | Needs DB? |
| --- | --- | --- |
| `llama-api` | Fastify + Prisma. Owns all database access. | Yes |
| `llama-bot` | Discord.js gateway client. Talks to the API over HTTP. | No |

Plus Postgres, which replaces the Railway-hosted database. Three containers.

Nothing needs to reach your laptop from the internet. The Discord gateway is an
**outbound** WebSocket, so there is no port forwarding, no public IP, no DNS, and
no certificates. Tailscale is only for *you* to reach the box.

---

## Step 1 — Publish the images

ZimaOS has no checkout of this repo, so it cannot build anything. Images are built
in CI and pulled from GHCR.

```bash
git push origin main
```

`.github/workflows/publish.yml` builds both images for `linux/amd64` and pushes:

- `ghcr.io/creatwixx/llama-api:latest`
- `ghcr.io/creatwixx/llama-bot:latest`

## Step 2 — Make the GHCR packages public

**Do not skip this.** GHCR packages default to *private* even when the repo is
public, and a private package means ZimaOS gets an auth error on pull.

For each of the two packages: github.com/users/creatwixx/packages → select package
→ Package settings → Change visibility → **Public**.

Public packages need no `docker login` on the laptop at all. (If you would rather
keep them private, you must `docker login ghcr.io` on the box with a PAT that has
`read:packages` — awkward on ZimaOS because the root filesystem is read-only and
Docker wants to write `~/.docker/config.json`. Public is much less friction.)

## Step 3 — Create the data directory

SSH into the laptop over Tailscale:

```bash
mkdir -p /DATA/AppData/llama-bot/postgres
```

`/DATA/AppData/<app>/` is the ZimaOS convention for data that survives container
recreation.

## Step 4 — Install the app

ZimaOS → App Store → **Install a Custom App**, and paste the contents of
[`infra/docker-compose.zima.yml`](../infra/docker-compose.zima.yml).

Replace three placeholders first:

| Placeholder | Value |
| --- | --- |
| `REPLACE_DB_PASSWORD` | A long random string. **Appears twice — both must match.** |
| `REPLACE_DISCORD_TOKEN` | Your bot token from discord.com/developers |
| `REPLACE_GUILD_ID` | A server ID for instant slash-command updates, or leave empty for global (up to 1h) |

Use **literal values, not `${VARS}`**. ZimaOS pastes the YAML without an
accompanying `.env` file, so `${...}` would silently resolve to an empty string.

The API migrates the database itself on every boot (`prisma migrate deploy` in its
entrypoint), so there is no separate migration step.

## Step 5 — Restore the production data

The API will happily start against an empty database and create the schema. To get
the real emotes in, restore the dump.

Copy `railway_backup.dump` to the laptop (ZimaOS Files UI, or `scp` over Tailscale)
at `/DATA/AppData/llama-bot/railway_backup.dump`, then:

```bash
docker stop llama-api
```

```bash
docker run --rm --network llama-bot_default -v /DATA/AppData/llama-bot/railway_backup.dump:/dump.pgdump:ro -e PGPASSWORD='YOUR_DB_PASSWORD' postgres:18-alpine pg_restore -h llama-postgres -U llama -d llamabot --no-owner --no-privileges --clean --if-exists /dump.pgdump
```

```bash
docker start llama-api
```

Notes:

- **Stop the API first.** `--clean` drops tables, which fails or blocks while the
  API holds open connections.
- `--no-owner --no-privileges` is required: the dump's objects are owned by a
  `postgres` role that does not exist in this deployment (the user here is `llama`).
- `--clean --if-exists` makes the restore safe to re-run, and safe to run *after*
  the API has already created an empty schema.
- The dump includes Prisma's `_prisma_migrations` table with all 7 migrations
  marked applied, so the API logs `No pending migrations to apply.` on next boot.
  That is the expected, correct outcome.
- If you run `docker` from the ZimaOS built-in terminal and hit
  `mkdir /root/.docker: read-only file system`, become root and
  `export DOCKER_CONFIG=/var/lib/docker/.docker` first.

## Step 6 — Verify

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

All three should report `(healthy)`. Then, over Tailscale:

```bash
curl http://<laptop-tailscale-name>:8080/health
```

Expect `{"status":"ok","timestamp":"..."}`.

Row-count sanity check:

```bash
docker exec -e PGPASSWORD='YOUR_DB_PASSWORD' llama-postgres psql -U llama -d llamabot -c 'SELECT count(*) FROM "Emote";'
```

The reference dump contains **21 emotes across 2 guilds** (18 + 3) and 0 commands.

## Laptop settings

Two BIOS/OS settings matter more than anything in this guide:

- **Disable suspend-on-lid-close.** Otherwise the bot goes offline every time you
  shut the lid.
- **Enable restore-on-AC-power-loss** in the BIOS, so it comes back after an outage.

The battery is a free UPS.

---

## Notes and gotchas

**The API has no authentication.** Any device that can reach port 3000 can create
and delete emotes. That is why the compose file does **not** publish it — only the
bot reaches it, over the internal compose network. Only uncomment that `ports:`
block if you understand the exposure.

**Postgres 18, not 16.** `railway_backup.dump` was produced by `pg_dump` 18.1.
Restoring an 18 dump into an older server is not guaranteed to work.

**The postgres:18 image changed its data layout.** It sets
`PGDATA=/var/lib/postgresql/18/docker` and declares its volume at
`/var/lib/postgresql` — not `/var/lib/postgresql/data` as PG16 did. The compose
file mounts `/var/lib/postgresql` accordingly. Mounting the old PG16 path would
leave the real data directory inside the container layer, silently destroying the
database on every recreate.

**Updating.** Push to `main`, wait for CI, then on the laptop:

```bash
docker compose -f <compose-file> pull && docker compose -f <compose-file> up -d
```

Or add Watchtower to poll GHCR for you.

**A crash-looping bot container almost always means a bad token.** The logs show
`error: An invalid token was provided.` and the container restarts forever under
`restart: unless-stopped`. The healthcheck will correctly report unhealthy rather
than pretending everything is fine.
