/**
 * Public bill share endpoint.
 *
 * Security model:
 * - Uses the SERVICE ROLE key server-side — the anon key is never used for
 *   data queries.
 * - Queries ONLY by share_token. Returns ONLY the specific fields needed to
 *   render a bill — never owner_id, never other tenants' data.
 * - Rate-limited to 60 req/min per IP via the token validation guard.
 * - Token is a UUID validated with a strict regex before hitting the DB.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const TOKEN_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Simple in-memory rate limiter — resets on server restart (good enough for edge)
const rateMap = new Map<string, { count: number; reset: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  if (entry.count >= 60) return true;
  entry.count++;
  return false;
}

// Only expose the fields the share page actually needs — never owner_id
const SAFE_SELECT = [
  "id",
  "bs_year",
  "bs_month",
  "rent_this_month",
  "water_bill",
  "electricity_mode",
  "electricity_prev_reading",
  "electricity_curr_reading",
  "electricity_rate_snapshot",
  "electricity_service_charge",
  "electricity_direct_amount",
  "carry_forward_credit",
  "notes",
  "share_token",
  "additional_charges(id,label,amount)",
  "payments(id,payment_date_bs,amount_paid,payment_method,note)",
  "tenants(name,room_number)",
].join(", ");

export const Route = createFileRoute("/api/public/bill/$token")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        // ── Rate limit by IP ────────────────────────────────────────────
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          "unknown";

        if (isRateLimited(ip)) {
          return json({ error: "Too many requests" }, 429);
        }

        // ── Validate token format ───────────────────────────────────────
        const token = params.token;
        if (!TOKEN_REGEX.test(token)) {
          return json({ error: "Invalid link" }, 400);
        }

        // ── Use service role — never the anon key ───────────────────────
        const url = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
          console.error("[bill-share] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
          return json({ error: "Server configuration error" }, 500);
        }

        const supabase = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // ── Fetch ONLY by share_token, select ONLY safe fields ──────────
        const { data: bill, error } = await supabase
          .from("bills")
          .select(SAFE_SELECT)
          .eq("share_token", token)
          .not("share_token", "is", null) // extra guard: never return unshared bills
          .maybeSingle();

        if (error) {
          console.error("[bill-share] DB error:", error.message);
          return json({ error: "Not found" }, 404);
        }

        if (!bill) {
          return json({ error: "Not found or link has been disabled" }, 404);
        }

        return new Response(JSON.stringify(bill), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, no-store, max-age=0",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
