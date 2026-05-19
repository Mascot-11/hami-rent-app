import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ChargeSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(80),
  amount: z.number().positive(),
});

const BillInput = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  bs_year: z.number().int().min(2080).max(2100),
  bs_month: z.number().int().min(1).max(12),
  rent_this_month: z.number().min(0),
  water_bill: z.number().min(0),
  electricity_mode: z.enum(["per_unit", "direct"]),
  electricity_prev_reading: z.number().min(0).nullable().optional(),
  electricity_curr_reading: z.number().min(0).nullable().optional(),
  electricity_rate_snapshot: z.number().min(0).nullable().optional(),
  electricity_service_charge: z.number().min(0).default(0),
  electricity_direct_amount: z.number().min(0).nullable().optional(),
  carry_forward_credit: z.number().min(0).default(0),
  notes: z.string().max(2000).nullable().optional(),
  charges: z.array(ChargeSchema).default([]),
});

export const listBills = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tenant_id?: string; bs_year?: number; bs_month?: number }) =>
    z.object({
      tenant_id: z.string().uuid().optional(),
      bs_year: z.number().int().optional(),
      bs_month: z.number().int().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("bills").select("*, additional_charges(*), payments(*), tenants(name, room_number)");
    if (data.tenant_id) q = q.eq("tenant_id", data.tenant_id);
    if (data.bs_year != null) q = q.eq("bs_year", data.bs_year);
    if (data.bs_month != null) q = q.eq("bs_month", data.bs_month);
    const { data: rows, error } = await q.order("bs_year", { ascending: false }).order("bs_month", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getBill = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: bill, error } = await context.supabase
      .from("bills")
      .select("*, additional_charges(*), payments(*), tenants(*)")
      .eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return bill;
  });

export const saveBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BillInput.parse(d))
  .handler(async ({ data, context }) => {
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
      const { error } = await context.supabase.from("bills").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      const { error: delErr } = await context.supabase.from("additional_charges").delete().eq("bill_id", id);
      if (delErr) throw new Error(delErr.message);
    } else {
      const { data: row, error } = await context.supabase.from("bills").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      billId = row.id;
    }

    if (charges.length > 0) {
      const rows = charges.map((c) => ({
        owner_id: context.userId,
        bill_id: billId!,
        label: c.label,
        amount: c.amount,
      }));
      const { error: insErr } = await context.supabase.from("additional_charges").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }

    return { id: billId! };
  });

export const deleteBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("payments").delete().eq("bill_id", data.id);
    await context.supabase.from("additional_charges").delete().eq("bill_id", data.id);
    const { error } = await context.supabase.from("bills").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PaymentInput = z.object({
  bill_id: z.string().uuid(),
  payment_date_bs: z.string().trim().min(1).max(20),
  amount_paid: z.number().positive(),
  payment_method: z.enum(["cash", "bank", "esewa", "khalti", "other"]),
  note: z.string().max(500).nullable().optional(),
});

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PaymentInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payments").insert({
      ...data,
      owner_id: context.userId,
      note: data.note || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [tRes, bRes] = await Promise.all([
      context.supabase.from("tenants").select("*"),
      context.supabase.from("bills").select("*, additional_charges(*), payments(*), tenants(name, room_number)"),
    ]);
    if (tRes.error) throw new Error(tRes.error.message);
    if (bRes.error) throw new Error(bRes.error.message);
    return { tenants: tRes.data ?? [], bills: bRes.data ?? [] };
  });

export const exportAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [t, b, p, c] = await Promise.all([
      context.supabase.from("tenants").select("*"),
      context.supabase.from("bills").select("*"),
      context.supabase.from("payments").select("*"),
      context.supabase.from("additional_charges").select("*"),
    ]);
    return {
      tenants: t.data ?? [],
      bills: b.data ?? [],
      payments: p.data ?? [],
      additional_charges: c.data ?? [],
    };
  });

export const restoreBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    tenants: z.array(z.any()).default([]),
    bills: z.array(z.any()).default([]),
    payments: z.array(z.any()).default([]),
    additional_charges: z.array(z.any()).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const stamp = (rows: any[]) => rows.map((r) => ({ ...r, owner_id: context.userId }));
    if (data.tenants.length) await context.supabase.from("tenants").upsert(stamp(data.tenants));
    if (data.bills.length) await context.supabase.from("bills").upsert(stamp(data.bills));
    if (data.additional_charges.length) await context.supabase.from("additional_charges").upsert(stamp(data.additional_charges));
    if (data.payments.length) await context.supabase.from("payments").upsert(stamp(data.payments));
    return { ok: true };
  });
