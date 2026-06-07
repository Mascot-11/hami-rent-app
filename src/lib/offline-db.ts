/**
 * offline-db.ts
 * IndexedDB wrapper for offline-first data storage.
 * Mirrors the Supabase schema: tenants, bills, additional_charges, payments.
 * Also maintains a sync_queue for mutations made while offline.
 */

const DB_NAME = "hamro_rent_offline";
const DB_VERSION = 1;

export type SyncOp = {
  id: string;
  table: "tenants" | "bills" | "additional_charges" | "payments";
  op: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  created_at: number; // timestamp ms
  retries: number;
};

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("[offline-db] IndexedDB is not available in this environment (SSR?)")
    );
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Mirror tables
      if (!db.objectStoreNames.contains("tenants")) {
        db.createObjectStore("tenants", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("bills")) {
        const bills = db.createObjectStore("bills", { keyPath: "id" });
        bills.createIndex("tenant_id", "tenant_id");
        bills.createIndex("owner_id", "owner_id");
      }
      if (!db.objectStoreNames.contains("additional_charges")) {
        const ac = db.createObjectStore("additional_charges", { keyPath: "id" });
        ac.createIndex("bill_id", "bill_id");
      }
      if (!db.objectStoreNames.contains("payments")) {
        const p = db.createObjectStore("payments", { keyPath: "id" });
        p.createIndex("bill_id", "bill_id");
      }
      // Outbox for offline mutations
      if (!db.objectStoreNames.contains("sync_queue")) {
        const sq = db.createObjectStore("sync_queue", { keyPath: "id" });
        sq.createIndex("created_at", "created_at");
      }
      // Metadata (last_synced, etc.)
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };

    req.onsuccess = () => { _db = req.result; resolve(req.result); };
    req.onerror = () => reject(req.error);
  });
}

// ── Generic helpers ──────────────────────────────────────────────────────────

function tx(
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode = "readonly"
): IDBTransaction {
  return db.transaction(stores, mode);
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return promisify(tx(db, store).objectStore(store).getAll());
}

function getByIndex<T>(db: IDBDatabase, store: string, index: string, key: IDBValidKey): Promise<T[]> {
  return promisify(
    tx(db, store).objectStore(store).index(index).getAll(key)
  );
}

function put(db: IDBDatabase, store: string, value: unknown): Promise<IDBValidKey> {
  return promisify(tx(db, store, "readwrite").objectStore(store).put(value as object));
}

function putMany(db: IDBDatabase, store: string, values: unknown[]): Promise<void> {
  return new Promise((res, rej) => {
    const t = tx(db, store, "readwrite");
    const os = t.objectStore(store);
    values.forEach((v) => os.put(v as object));
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

function del(db: IDBDatabase, store: string, key: IDBValidKey): Promise<void> {
  return promisify(tx(db, store, "readwrite").objectStore(store).delete(key)) as Promise<void>;
}

// ── Public API ───────────────────────────────────────────────────────────────

export const offlineDB = {
  // ── Seed / replace all data after a full sync ────────────────────────────
  async seedAll(data: {
    tenants?: unknown[];
    bills?: unknown[];
    additional_charges?: unknown[];
    payments?: unknown[];
  }) {
    const db = await openDB();
    const ops: Promise<void>[] = [];
    if (data.tenants?.length) ops.push(putMany(db, "tenants", data.tenants));
    if (data.bills?.length) ops.push(putMany(db, "bills", data.bills));
    if (data.additional_charges?.length) ops.push(putMany(db, "additional_charges", data.additional_charges));
    if (data.payments?.length) ops.push(putMany(db, "payments", data.payments));
    await Promise.all(ops);
    await put(db, "meta", { key: "last_synced", value: Date.now() });
  },

  // ── Tenants ──────────────────────────────────────────────────────────────
  async getTenants(): Promise<unknown[]> {
    const db = await openDB();
    return getAll(db, "tenants");
  },

  async putTenant(tenant: object) {
    const db = await openDB();
    return put(db, "tenants", tenant);
  },

  async deleteTenant(id: string) {
    const db = await openDB();
    return del(db, "tenants", id);
  },

  // ── Bills ────────────────────────────────────────────────────────────────
  async getBills(): Promise<unknown[]> {
    const db = await openDB();
    return getAll(db, "bills");
  },

  async getBillsByTenant(tenantId: string): Promise<unknown[]> {
    const db = await openDB();
    return getByIndex(db, "bills", "tenant_id", tenantId);
  },

  async putBill(bill: object) {
    const db = await openDB();
    return put(db, "bills", bill);
  },

  async deleteBill(id: string) {
    const db = await openDB();
    return del(db, "bills", id);
  },

  // ── Additional charges ───────────────────────────────────────────────────
  async getChargesByBill(billId: string): Promise<unknown[]> {
    const db = await openDB();
    return getByIndex(db, "additional_charges", "bill_id", billId);
  },

  async putCharge(charge: object) {
    const db = await openDB();
    return put(db, "additional_charges", charge);
  },

  async deleteCharge(id: string) {
    const db = await openDB();
    return del(db, "additional_charges", id);
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  async getPaymentsByBill(billId: string): Promise<unknown[]> {
    const db = await openDB();
    return getByIndex(db, "payments", "bill_id", billId);
  },

  async putPayment(payment: object) {
    const db = await openDB();
    return put(db, "payments", payment);
  },

  async deletePayment(id: string) {
    const db = await openDB();
    return del(db, "payments", id);
  },

  // ── Sync queue ───────────────────────────────────────────────────────────
  async enqueue(op: Omit<SyncOp, "id" | "created_at" | "retries">) {
    const db = await openDB();
    const item: SyncOp = {
      ...op,
      id: crypto.randomUUID(),
      created_at: Date.now(),
      retries: 0,
    };
    await put(db, "sync_queue", item);
    return item;
  },

  async getQueue(): Promise<SyncOp[]> {
    const db = await openDB();
    return getAll<SyncOp>(db, "sync_queue");
  },

  async removeFromQueue(id: string) {
    const db = await openDB();
    return del(db, "sync_queue", id);
  },

  async incrementRetry(id: string) {
    const db = await openDB();
    const t = tx(db, "sync_queue", "readwrite");
    const os = t.objectStore("sync_queue");
    const item = await promisify<SyncOp>(os.get(id));
    if (item) {
      item.retries += 1;
      os.put(item);
    }
    return new Promise<void>((res, rej) => {
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
    });
  },

  // ── Meta ─────────────────────────────────────────────────────────────────
  async getLastSynced(): Promise<number | null> {
    const db = await openDB();
    const row = await promisify<{ key: string; value: number } | undefined>(
      tx(db, "meta").objectStore("meta").get("last_synced")
    );
    return row?.value ?? null;
  },

  async setLastSynced(ts: number) {
    const db = await openDB();
    await put(db, "meta", { key: "last_synced", value: ts });
  },
};
