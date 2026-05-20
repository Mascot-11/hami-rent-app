// Centralized plain-English help copy for every "?" icon in the app.
export const HELP = {
  // Auth
  authEmail: "The email you sign in with. We never share it.",
  authPassword: "At least 6 characters. Use something you'll remember.",
  authSwitchMode: "First time here? Switch to 'Sign up' to create your account.",

  // Tenant form
  tenantName: "Full name of the person renting the room. Required.",
  tenantRoom: "Room or unit identifier (e.g. '2A', 'Ground floor'). Helps you find them quickly.",
  tenantPhone: "Optional. Useful for sending payment reminders.",
  tenantMoveIn: "When the tenant moved in, in Bikram Sambat (e.g. '2081-04-15'). Used to validate that bill months come after move-in.",
  tenantNotes: "General notes about this tenant — agreement details, preferences, anything you want to remember.",

  // Bill form
  billTenant: "Pick the tenant this bill is for. Only active tenants appear.",
  billMonth: "The Nepali (BS) month this bill covers. Only one bill per tenant per month is allowed.",
  rent: "Rent for THIS month only. Entered fresh every month — there is no default. Each month can differ.",
  water: "Water charge for this month in NPR. Leave 0 if not applicable.",
  electricityMode: "Two ways to bill electricity:\n• Per Unit — enter meter readings and rate, the app calculates the amount.\n• Direct Amount — enter a flat NPR figure (useful when you pay NEA directly).",
  electricityPrev: "Previous month's meter reading (units).",
  electricityCurr: "This month's meter reading (units). Must be greater than the previous reading.",
  electricityRate: "Rate per unit in NPR (e.g. 13).",
  electricityService: "Optional fixed service or line charge added on top.",
  electricityDirect: "The flat NPR amount to charge for electricity this month.",
  carryForward: "Credit carried over from last month (overpayment). It reduces this month's total automatically.",
  previousDue: "Unpaid balance from previous bills, automatically detected. It is added to this month's bill as a 'Previous balance due' line. You can edit or remove the line if needed.",
  additionalCharges: "Extra charges beyond rent, water, and electricity — e.g. Garbage, Internet, Parking. Add as many as you need. They do NOT carry over to next month automatically.",
  chargeLabel: "Name of the charge (e.g. 'Garbage Collection'). Required.",
  chargeAmount: "NPR amount for this charge.",
  billNotes: "Notes specific to THIS bill (e.g. 'agreed to pay in two parts', 'meter estimated').",

  // Payment form
  paymentDate: "Date the payment was received, in BS (e.g. '2081-05-03').",
  paymentAmount: "How much the tenant paid in this transaction. Must be greater than 0. Partial payments are fine — record one entry per transaction.",
  paymentMethod: "How the payment was received: Cash, Bank transfer, eSewa, Khalti, or Other.",
  paymentNote: "Optional note (e.g. 'first instalment', 'paid via phone').",

  // Status badges
  statusPaid: "The total bill has been fully paid.",
  statusPartial: "Some money has been paid but a balance remains. Record another payment to reduce it.",
  statusPending: "No payments recorded yet for this bill.",
  statusOverpaid: "More was paid than owed. The extra is credited automatically to the next month's bill.",

  // Bill total
  billTotal: "Total = Rent + Water + Electricity + Additional Charges − Carry-forward credit. Always recomputed live from the line items — never edited directly.",
  remainingBalance: "Total bill minus the sum of all payments recorded for this bill.",

  // Dashboard
  dashActiveTenants: "Currently renting tenants (not archived).",
  dashPaidThisMonth: "Tenants whose bill for the current BS month is fully settled.",
  dashPendingThisMonth: "Tenants whose bill for the current BS month has no payment yet or only a partial payment.",
  dashCollected: "Total NPR collected for the current BS month so far.",
  dashExpected: "Total NPR billed for the current BS month (sum of all bills).",

  // Bill actions
  downloadPdf: "Generates a printable PDF of this bill. Your browser opens a print dialog — choose 'Save as PDF' as the destination.",
  shareLink: "Copies a private link to this bill. Anyone with the link can view the bill (read-only, no edits). The link only works for this specific bill.",

  // Export
  exportAllTenants: "Excel workbook with three sheets: every monthly bill across all tenants, lifetime totals per tenant, and every individual payment transaction.",
  exportTenantWise: "Excel workbook for a single tenant: their monthly bills, all payments, and a summary card.",
  exportFilterYear: "Limit the export to a specific BS year.",
  exportFilterStatus: "Only include bills with a particular status (Paid, Partial, Pending).",

  // Settings / Backup
  backup: "Download a JSON file containing all your tenants, bills, additional charges, and payments. Keep it somewhere safe.",
  restore: "Restore data from a backup JSON file. Existing data is NOT removed — restore adds the missing records back.",

  // Archive / Deactivate
  archiveTenant: "Archive a tenant who has moved out. Their full history stays available; you can reactivate them later. Nothing is permanently deleted.",
};
