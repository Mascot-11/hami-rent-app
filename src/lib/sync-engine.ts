/**
 * sync-engine.ts
 * Pulls fresh data from Supabase → IndexedDB (full sync).
 * Pushes queued offline mutations → Supabase (flush queue).
 * Called on: app load, regain online, background sync event.
 */

import { supabase } from "@/integrations/supabase/client";
import { offlineDB, type SyncOp } from "./offline-db";

// ── Pull: Supabase → IndexedDB ──────────────────────────────────────────────

export async function pullFromServer(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const [tenants, bills, charges, payments] = await Promise.all([
    supabase.from("tenants").select("*").order("name"),
    supabase.from("bills").select("*"),
    supabase.from("additional_charges").select("*"),
    supabase.from("payments").select("*"),
  ]);

  await offlineDB.seedAll({
    tenants: tenants.data ?? [],
    bills: bills.data ?? [],
    additional_charges: charges.data ?? [],
    payments: payments.data ?? [],
  });

  console.log("[sync] Pull complete —", new Date().toLocaleTimeString());
}

// ── Push: IndexedDB queue → Supabase ────────────────────────────────────────

const TABLE_MAP: Record<SyncOp["table"], string> = {
  tenants: "tenants",
  bills: "bills",
  additional_charges: "additional_charges",
  payments: "payments",
};

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { synced: 0, failed: 0 };

  const queue = await offlineDB.getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  // Sort oldest first
  const sorted = queue.sort((a, b) => a.created_at - b.created_at);

  let synced = 0;
  let failed = 0;

  for (const item of sorted) {
    if (item.retries >= 5) {
      // Give up after 5 attempts — remove from queue
      await offlineDB.removeFromQueue(item.id);
      failed++;
      continue;
    }

    try {
      let error: unknown = null;

      if (item.op === "insert") {
        const res = await supabase.from(TABLE_MAP[item.table]).upsert(item.payload as object);
        error = res.error;
      } else if (item.op === "update") {
        const { id, ...rest } = item.payload as { id: string; [k: string]: unknown };
        const res = await supabase.from(TABLE_MAP[item.table]).update(rest).eq("id", id);
        error = res.error;
      } else if (item.op === "delete") {
        const { id } = item.payload as { id: string };
        const res = await supabase.from(TABLE_MAP[item.table]).delete().eq("id", id);
        error = res.error;
      }

      if (error) throw error;

      await offlineDB.removeFromQueue(item.id);
      synced++;
    } catch (err) {
      console.error("[sync] Failed to push item", item.id, err);
      await offlineDB.incrementRetry(item.id);
      failed++;
    }
  }

  console.log(`[sync] Flush complete — synced: ${synced}, failed: ${failed}`);
  return { synced, failed };
}

// ── Full sync cycle ──────────────────────────────────────────────────────────

export async function fullSync(): Promise<void> {
  if (!navigator.onLine) return;
  await flushQueue();   // push local changes first
  await pullFromServer(); // then pull authoritative state
}
