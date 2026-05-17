
# Rent Management System — Implementation Plan

A simple web app for a landlord to manage tenants, monthly bills (Bikram Sambat), and payments. Data lives in **Lovable Cloud** (Supabase) tables. Every feature gets a small "?" help icon with a plain-language tooltip so it's easy to use without reading docs.

## Stack & storage

- **Lovable Cloud** (Supabase Postgres) for all persistence — tenants, bills, additional charges, payments.
- **Auth**: email + password (single landlord). Every table is owner-scoped via `owner_id = auth.uid()` with RLS so only the logged-in landlord sees their data. This also makes the app safely multi-landlord later.
- TanStack Start + React + Tailwind + shadcn/ui (already set up). Lucide icons. `xlsx` for Excel export, browser print for PDF bills.
- All DB reads/writes go through `createServerFn` + `requireSupabaseAuth` (RLS as the user). TanStack Query for caching and invalidation.

## Database schema (Lovable Cloud migrations)

```
tenants
  id uuid pk, owner_id uuid (auth.uid), name text not null, room_number text,
  phone text, move_in_date_bs text, notes text, is_active bool default true,
  created_at timestamptz default now()

bills
  id uuid pk, owner_id uuid, tenant_id uuid fk,
  bs_year int, bs_month int (1-12),
  rent_this_month numeric, water_bill numeric default 0,
  electricity_mode text check in ('per_unit','direct'),
  electricity_prev_reading numeric, electricity_curr_reading numeric,
  electricity_rate_snapshot numeric, electricity_service_charge numeric default 0,
  electricity_direct_amount numeric,
  carry_forward_credit numeric default 0,
  notes text, created_at, last_modified_at,
  UNIQUE (tenant_id, bs_year, bs_month)   -- prevents duplicate bills

additional_charges
  id uuid pk, owner_id uuid, bill_id uuid fk, label text not null, amount numeric > 0

payments
  id uuid pk, owner_id uuid, bill_id uuid fk,
  payment_date_bs text, amount_paid numeric > 0,
  payment_method text check in ('cash','bank','esewa','khalti','other'),
  note text, created_at
```

- RLS: `owner_id = auth.uid()` on every table for select/insert/update/delete.
- Totals are **always computed in code from line items + payments** (never trust a stored total) per §5.5.

## Pages (TanStack routes)

- `/login` — email + password
- `/_authenticated/` — pathless layout that gates everything below via `beforeLoad`
  - `/` Dashboard
  - `/tenants` list + add/edit
  - `/tenants/$tenantId` profile + history + payments + per-tenant Excel + PDF print
  - `/bills/new` create bill
  - `/bills/$billId` bill detail + payments
  - `/export` all-tenants Excel with filters
  - `/settings` JSON backup / restore (admin export of all rows)

Each route file has its own `head()` with a unique title/description.

## Server functions (`src/lib/*.functions.ts`)

All protected with `requireSupabaseAuth`:
- `tenants.functions.ts` — list/get/create/update/archive/reactivate
- `bills.functions.ts` — list (by tenant, by month), get (with charges + payments), create, update, delete
- `payments.functions.ts` — list, record, delete
- `dashboard.functions.ts` — current BS month aggregates
- `export.functions.ts` — build dataset for Excel (filters applied server-side); workbook assembled client-side with `xlsx`

## Core client modules (`src/lib/`)

- `bs-calendar.ts` — BS month names, day counts per `(year, month)` for 2080–2090, validators, numeric sort by `(bs_year, bs_month)`.
- `calc.ts` — `computeElectricity`, `computeBillTotal`, `computePaid`, `computeRemaining`, `computeStatus` (Paid / Partial / Pending / Overpaid), `applyCarryForward`.
- `validators.ts` — all §5 rules (blocks vs. soft warnings).
- `excel.ts` — three-sheet workbooks (Monthly Summary, Tenant Overview, Payment Ledger) + tenant-wise variant.
- `help-copy.ts` — centralized plain-English help text for every `?` tooltip.

## Components

- `HelpTip` — the `?` icon. Tiny `HelpCircle` next to every label/section, opens a Popover. Used **everywhere**: every form field, every status badge, every dashboard card, every export filter, every settings option.
- `BSMonthPicker`, `BSDatePicker` (validates day vs. BS table)
- `StatusBadge` (Paid / Partial / Pending / Overpaid, color-coded)
- `WarningDialog` (soft warnings vs. blocking errors)
- `ChargeLabelInput` — autocomplete from past labels (§5.3)
- `MoneyInput` — NPR, numeric, blocks negatives

## Edge-case handling (built into forms, not bolted on later)

All §5 rules wired into `validators.ts` + `WarningDialog`:
- DB-level: unique `(tenant_id, bs_year, bs_month)`, check `amount > 0`, `electricity_mode` enum.
- App-level: current<prev reading block, blank label block, rent=0 warn, payment>remaining → Overpaid + carry-forward, deactivate-with-balance warn, same-room warn, duplicate-payment warn, edit-after-payment recalculation, block deletion of a bill whose overpayment was applied downstream, etc.

## Help-icon coverage (the "?" everywhere)

- **Every form field**: label + `?` with plain explanation and an example.
- **Status badges**: `?` explains how status is computed.
- **Dashboard cards**: `?` explains what each metric counts.
- **Bill totals**: `?` shows the live formula breakdown.
- **Export page**: `?` on each filter and sheet describing the columns.
- **Settings**: `?` explains what backup/restore does.

## Design

- Warm, friendly palette (sand/cream + deep terracotta accent) — personal landlord tool, not corporate.
- Inter for body, Instrument Serif for headers.
- Rounded cards, generous spacing, mobile-friendly (landlord may use phone).
- All colors as `oklch` tokens in `src/styles.css`; no hard-coded colors in components.

## Build order

1. Enable Lovable Cloud, create schema + RLS, set up email/password auth + `_authenticated` layout + login page
2. BS calendar module + base layout + nav + Dashboard shell
3. Tenants CRUD (with archive)
4. Bill creation (rent, water, electricity A/B, additional charges) + validators
5. Bill detail + payments (full/partial, carry-forward)
6. Dashboard metrics + tenant detail + history filters
7. Notes (tenant + bill), PDF bill print
8. Excel export (all-tenants + tenant-wise) with filters
9. JSON backup/restore + final help-tooltip sweep

## Out of scope (per spec)

No tenant login, no SMS/email, no online payments, no AD calendar, no refunds, no multi-property in v1.

Ready to build on approval.
