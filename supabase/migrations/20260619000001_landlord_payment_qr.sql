-- Add a per-landlord payment QR code (e.g. eSewa / Khalti / bank QR).
-- Stored as a PATH in the existing private "tenant-docs" bucket, not a public
-- URL — same pattern as tenant photos/documents. Folder-scoped RLS on
-- storage.objects (see 20260611180000_security_audit_fixes.sql) already
-- restricts writes/reads to "<owner_id>/..." paths, so no new storage policy
-- is required as long as the app uploads to "<owner_id>/qr/...".
ALTER TABLE public.landlord_profiles
  ADD COLUMN IF NOT EXISTS payment_qr_path text;
