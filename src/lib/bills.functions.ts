import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbError } from "@/lib/db-error";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Throws if the bill doesn't belong to the authenticated user. */
async function assertBillOwner(supabase: any, billId: string, userId: string) {
  const { data, error } = await supabase
    .from("bills")
    .select("owner_id")
    .eq("id", billId)
    .single();
  if (error || !data) throw new Error("Bill not found");
  if (data.owner_id !== userId) throw new Error("Forbidden");
}

/** Throws if the payment doesn't belong to the authenticated user. */
async function assertPaymentOwner(supabase: any, paymentId: string, userId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("owner_id")
    .eq("id", paymentId)
    .single();
  if (error || !data) throw new Error("Payment not found");
  if (data.owner_id !== userId) throw new Error("Forbidden");
}

/** Throws if the tenant doesn't belong to the authenticated user. */
async function assertTenantOwner(supabase: any, tenantId: string, userId: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("owner_id")
    .eq("id", tenantId)
    .single();
  if (error || !data) throw new Error("Tenant not found");
  if (data.owner_id !== userId) throw new Error("Forbidden");
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ChargeSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(80),
  amount: z.number().positive().max(10_000_000),
});

const BillInput = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  bs_year: z.number().int().min(2080).max(2100),
  bs_month: z.number().int().min(1).max(12),
  rent_this_month: z.number().min(0).max(10_000_000),
  water_bill: z.number().min(0).max(1_000_000),
  electricity_mode: z.enum(["per_unit", "direct"]),
  electricity_prev_reading: z.number().min(0).nullable().optional(),
  electricity_curr_reading: z.number().min(0).nullable().optional(),
  electricity_rate_snapshot: z.number().min(0).nullable().optional(),
  electricity_service_charge: z.number().min(0).default(0),
  electricity_direct_amount: z.number().min(0).nullable().optional(),
  carry_forward_credit: z.number().min(0).default(0),
  notes: z.string().max(2000).nullable().optional(),
  charges: z.array(ChargeSchema).max(20).default([]),
});

const PaymentInput = z.object({
  bill_id: z.string().uuid(),
  payment_date_bs: z.string().trim().regex(/^(20[7-9]\\d|2110)-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\\d|3[0-2])$/, "BS date must be YYYY-MM-DD"),
  amount_paid: z.number().positive().max(10_000_000),
  payment_method: z.enum(["cash", "bank", "esewa", "khalti", "other"]),
  note: z.string().max(500).nullable().optional(),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listBills = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tenant_id?: string; bs_year?: number; bs_month?: number }) =>
    z.object({
      tenant_id: z.string().uuid().optional(),
      bs_year: z.number().int().optional(),
      bs_month: z.number().int().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("bills")
      .select("*, additional_charges(*), payments(*), tenants(name, room_number)")
      .eq("owner_id", context.userId); // explicit ownership on every list query
    if (data.tenant_id) q = q.eq("tenant_id", data.tenant_id);
    if (data.bs_year != null) q = q.eq("bs_year", data.bs_year);
    if (data.bs_month != null) q = q.eq("bs_month", data.bs_month);
    const { data: rows, error } = await q
      .order("bs_year", { ascending: false })
      .order("bs_month", { ascending: false });
    if (error) throw dbError(error);
    return rows ?? [];
  });

export const getBill = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: bill, error } = await context.supabase
      .from("bills")
      .select("*, additional_charges(*), payments(*), tenants(*)")
      .eq("id", data.id)
      .eq("owner_id", context.userId) // explicit ownership
      .single();
    if (error) throw new Error("Bill not found");
    return bill;
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [tRes, bRes] = await Promise.all([
      context.supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", context.userId),
      context.supabase
        .from("bills")
        .select("*, additional_charges(*), payments(*), tenants(name, room_number)")
        .eq("owner_id", context.userId),
    ]);
    if (tRes.error) throw dbError(tRes.error);
    if (bRes.error) throw dbError(bRes.error);
    return { tenants: tRes.data ?? [], bills: bRes.data ?? [] };
  });

export const exportAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [t, b, p, c] = await Promise.all([
      context.supabase.from("tenants").select("*").eq("owner_id", context.userId),
      context.supabase.from("bills").select("*").eq("owner_id", context.userId),
      context.supabase.from("payments").select("*").eq("owner_id", context.userId),
      context.supabase.from("additional_charges").select("*").eq("owner_id", context.userId),
    ]);
    return {
      tenants: t.data ?? [],
      bills: b.data ?? [],
      payments: p.data ?? [],
      additional_charges: c.data ?? [],
    };
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const saveBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BillInput.parse(d))
  .handler(async ({ data, context }) => {
    // Verify the tenant belongs to this user before creating/updating a bill for them
    await assertTenantOwner(context.supabase, data.tenant_id, context.userId);

    const { charges, id, ...billData } = data;
    const payload = {
      ...billData,
      owner_id: context.userId,
      notes: billData.notes || null,
      electricity_prev_reading: billData.electricity_mode === "per_unit" ? billData.electricity_prev_reading ?? null : null,
      electricity_curr_reading: billData.electricity_mode === "per_unit" ? billData.electricity_curr_reading ?? null : null,
      electricity_rate_snapshot: billData.electricity_mode === "per_unit" ? billData.electricity_rate_snapshot ?? null : null,
      electricity_direct_amount: billData.electricity_mode === "direct" ? billData.electricity_direct_amount ?? null : null,
    };

    let billId = id;
    if (id) {
      // For updates, verify ownership before writing
      await assertBillOwner(context.supabase, id, context.userId);
      const { error } = await context.supabase
        .from("bills")
        .update(payload)
        .eq("id", id)
        .eq("owner_id", context.userId);
      if (error) throw dbError(error);
      const { error: delErr } = await context.supabase
        .from("additional_charges")
        .delete()
        .eq("bill_id", id)
        .eq("owner_id", context.userId);
      if (delErr) throw dbError(delErr);
    } else {
      const { data: row, error } = await context.supabase
        .from("bills")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw dbError(error);
      billId = row.id;
    }

    if (charges.length > 0) {
      const rows = charges.map((c) => ({
        owner_id: context.userId,
        bill_id: billId!,
        label: c.label,
        amount: c.amount,
      }));
      const { error: insErr } = await context.supabase
        .from("additional_charges")
        .insert(rows);
      if (insErr) throw dbError(insErr);
    }

    return { id: billId! };
  });

export const deleteBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Verify ownership before deleting anything
    await assertBillOwner(context.supabase, data.id, context.userId);
    // Delete child records first, scoped to this owner
    await context.supabase.from("payments").delete().eq("bill_id", data.id).eq("owner_id", context.userId);
    await context.supabase.from("additional_charges").delete().eq("bill_id", data.id).eq("owner_id", context.userId);
    const { error } = await context.supabase
      .from("bills")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw dbError(error);
    return { ok: true };
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PaymentInput.parse(d))
  .handler(async ({ data, context }) => {
    // Verify the bill being paid belongs to this user
    await assertBillOwner(context.supabase, data.bill_id, context.userId);
    const { error } = await context.supabase.from("payments").insert({
      ...data,
      owner_id: context.userId,
      note: data.note || null,
    });
    if (error) throw dbError(error);
    return { ok: true };
  });

// Keep addPayment as an alias to avoid breaking any callers using the old name
export const addPayment = recordPayment;

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Verify ownership before deleting
    await assertPaymentOwner(context.supabase, data.id, context.userId);
    const { error } = await context.supabase
      .from("payments")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw dbError(error);
    return { ok: true };
  });

export const restoreBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    tenants: z.array(z.any()).max(500).default([]),
    bills: z.array(z.any()).max(5000).default([]),
    payments: z.array(z.any()).max(10000).default([]),
    additional_charges: z.array(z.any()).max(20000).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Strip all IDs and force owner_id to current user — prevents restoring
    // another user's data into your account or cross-contamination
    const stamp = (rows: any[]) =>
      rows.map((r) => ({
        ...r,
        owner_id: context.userId, // always overwrite — input cannot dictate this
      }));

    if (data.tenants.length) {
      await context.supabase.from("tenants").upsert(stamp(data.tenants));
    }
    if (data.bills.length) {
      await context.supabase.from("bills").upsert(stamp(data.bills));
    }
    if (data.additional_charges.length) {
      await context.supabase.from("additional_charges").upsert(stamp(data.additional_charges));
    }
    if (data.payments.length) {
      await context.supabase.from("payments").upsert(stamp(data.payments));
    }
    return { ok: true };
  });
