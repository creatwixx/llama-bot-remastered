import { FastifyInstance } from "fastify";
import { readFileSync } from "fs";
import { join } from "path";
import prisma from "../prisma.js";

// The bot exposes a health server on its own port. From inside the compose
// network we reach it by container name; override for local dev.
const BOT_HEALTH_URL =
  process.env.BOT_HEALTH_URL || "http://llama-bot:8080/health";

const UI_PATH = join(process.cwd(), "src/public/index.html");

// Read once in production; re-read every request in development so editing the
// dashboard doesn't need a restart.
let cachedUi: string | null = null;
function loadUi(): string {
  if (process.env.NODE_ENV === "development") return readFileSync(UI_PATH, "utf8");
  if (cachedUi === null) cachedUi = readFileSync(UI_PATH, "utf8");
  return cachedUi;
}

type Check = { ok: boolean; latencyMs?: number; detail?: string };

// Prisma's groupBy return type doesn't survive destructuring out of Promise.all,
// so name the shapes explicitly.
type GuildGroup = {
  guildId: string | null;
  _count: { _all: number };
  _sum: { useCount: number | null };
};
type GuildSummary = { guildId: string | null; emotes: number; uses: number };

export default async function adminRoutes(fastify: FastifyInstance) {
  // Dashboard
  fastify.get("/", async (request, reply) => {
    try {
      return reply.type("text/html; charset=utf-8").send(loadUi());
    } catch {
      return reply
        .code(500)
        .type("text/plain")
        .send("Dashboard UI not found at src/public/index.html");
    }
  });

  // Aggregated health + stats for the dashboard tiles.
  fastify.get("/admin/status", async () => {
    const database: Check = await (async () => {
      const t = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { ok: true, latencyMs: Date.now() - t };
      } catch (error: any) {
        return { ok: false, detail: error?.message ?? "query failed" };
      }
    })();

    const bot: Check = await (async () => {
      const t = Date.now();
      try {
        const res = await fetch(BOT_HEALTH_URL, {
          signal: AbortSignal.timeout(4000),
        });
        return res.ok
          ? { ok: true, latencyMs: Date.now() - t }
          : { ok: false, detail: `HTTP ${res.status}` };
      } catch (error: any) {
        // A timeout here usually means the bot container is down or the two
        // containers aren't on the same user-defined network.
        return { ok: false, detail: error?.message ?? "unreachable" };
      }
    })();

    const api: Check = { ok: true, latencyMs: 0 };

    let stats = null;
    if (database.ok) {
      const [emotes, emotesEnabled, commands, uses, byGuild] = await Promise.all([
        prisma.emote.count(),
        prisma.emote.count({ where: { enabled: true } }),
        prisma.command.count(),
        prisma.emote.aggregate({ _sum: { useCount: true } }),
        prisma.emote.groupBy({
          by: ["guildId"],
          _count: { _all: true },
          _sum: { useCount: true },
        }),
      ]);

      stats = {
        emotes,
        emotesEnabled,
        commands,
        totalUses: uses._sum.useCount ?? 0,
        guilds: byGuild
          .map((g: GuildGroup) => ({
            guildId: g.guildId,
            emotes: g._count._all,
            uses: g._sum.useCount ?? 0,
          }))
          .sort((a: GuildSummary, b: GuildSummary) => b.emotes - a.emotes),
      };
    }

    return {
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      checks: { api, database, bot },
      healthy: api.ok && database.ok && bot.ok,
      stats,
    };
  });

  // Test every emote's image URL and report which are dead.
  //
  // Worth having because Discord attachment links (media.discordapp.net) carry
  // expiring signature params — ex / is / hm — and stop resolving after a while.
  // An emote with a dead link still "works": the bot posts an embed with no image.
  fastify.get("/admin/link-check", async () => {
    const emotes = await prisma.emote.findMany({
      select: { id: true, trigger: true, imageUrl: true, guildId: true },
    });

    const results: Array<{
      id: string;
      trigger: string;
      guildId: string | null;
      ok: boolean;
      status: number | null;
      detail?: string;
    }> = [];

    // Small concurrency cap so a big emote list doesn't open hundreds of sockets.
    const CONCURRENCY = 6;
    let cursor = 0;

    async function worker() {
      while (cursor < emotes.length) {
        const e = emotes[cursor++];
        if (!e) break;
        try {
          // Some hosts reject HEAD; fall back to a ranged GET before believing it.
          let res = await fetch(e.imageUrl, {
            method: "HEAD",
            redirect: "follow",
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok && res.status !== 404) {
            res = await fetch(e.imageUrl, {
              method: "GET",
              headers: { Range: "bytes=0-0" },
              redirect: "follow",
              signal: AbortSignal.timeout(8000),
            });
          }
          results.push({
            id: e.id,
            trigger: e.trigger,
            guildId: e.guildId,
            ok: res.ok || res.status === 206,
            status: res.status,
          });
        } catch (error: any) {
          results.push({
            id: e.id,
            trigger: e.trigger,
            guildId: e.guildId,
            ok: false,
            status: null,
            detail: error?.message ?? "request failed",
          });
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, emotes.length) }, worker)
    );

    return {
      checkedAt: new Date().toISOString(),
      total: results.length,
      broken: results.filter((r) => !r.ok).length,
      results,
    };
  });
}
