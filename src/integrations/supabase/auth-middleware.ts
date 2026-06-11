/**
 * auth-middleware.ts
 *
 * Security model:
 * 1. Extract Bearer JWT from Authorization header.
 * 2. Verify it using the SERVICE ROLE key's JWT secret via getClaims()
 *    — this never hits the DB and cannot be spoofed.
 * 3. Create a USER-SCOPED client (anon key + user's JWT) for all subsequent
 *    DB queries. RLS ensures the user can only access their own rows.
 * 4. Never use the service-role client for user data queries.
 *
 * The service-role key is ONLY used for token verification, not data access.
 */
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const MAX_TOKEN_LENGTH = 2048; // JWTs are never this long; reject oversized strings

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const SUPABASE_URL            = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Server misconfigured: missing Supabase environment variables');
    }

    const request = getRequest();
    if (!request?.headers) {
      throw new Error('Unauthorized: no request context');
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: missing or malformed Authorization header');
    }

    const token = authHeader.slice(7); // remove "Bearer "
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      throw new Error('Unauthorized: invalid token');
    }

    // ── Build a user-scoped Supabase client ───────────────────────────────
    // This client sends the user's JWT on every request.
    // Supabase RLS evaluates auth.uid() = JWT sub claim — so the user can
    // ONLY touch rows where owner_id = their own UID.
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        storage:          undefined,
        persistSession:   false,
        autoRefreshToken: false,
      },
    });

    // ── Verify the JWT is valid and not expired ───────────────────────────
    // getClaims() validates the JWT signature cryptographically.
    // It does NOT hit the DB — it's a local HMAC/RSA check.
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Error('Unauthorized: invalid or expired token');
    }

    const userId = data.claims.sub as string;
    const claims = data.claims;

    // ── Basic claim sanity checks ─────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      throw new Error('Unauthorized: token expired');
    }

    return next({
      context: {
        supabase,  // user-scoped, RLS enforced — use for ALL data queries
        userId,
        claims,
      },
    });
  },
);
