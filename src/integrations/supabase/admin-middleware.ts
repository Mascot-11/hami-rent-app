/**
 * admin-middleware.ts
 *
 * Extends requireSupabaseAuth with an admin check.
 *
 * Security model:
 * 1. Validate the user's JWT (same as requireSupabaseAuth).
 * 2. Check admin_roles using the SERVICE ROLE client — the only safe way
 *    since admin_roles has DENY ALL policies for JWT-authenticated roles.
 * 3. Return the service-role client in context so admin functions can
 *    query any user's data without RLS restrictions.
 * 4. The service-role client is NEVER returned in non-admin context.
 */
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const MAX_TOKEN_LENGTH = 2048;

export const requireAdmin = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const SUPABASE_URL             = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Server misconfigured: missing Supabase environment variables');
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      // Hard fail — admin panel requires service role key
      throw new Error('Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is required for admin access');
    }

    // ── Step 1: Validate JWT ──────────────────────────────────────────────
    const request = getRequest();
    if (!request?.headers) throw new Error('Unauthorized: no request context');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: missing Authorization header');
    }

    const token = authHeader.slice(7);
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      throw new Error('Unauthorized: invalid token');
    }

    // User-scoped client for JWT verification only
    const userClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await userClient.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Error('Unauthorized: invalid or expired token');
    }

    const userId = data.claims.sub as string;
    const now = Math.floor(Date.now() / 1000);
    if (data.claims.exp && data.claims.exp < now) {
      throw new Error('Unauthorized: token expired');
    }

    // ── Step 2: Check admin_roles via service-role client ─────────────────
    // admin_roles has DENY ALL for JWT roles — must use service role key.
    const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data: roleRow, error: roleError } = await adminClient
      .from('admin_roles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError) {
      console.error('[admin-middleware] role check error:', roleError.message);
      throw new Error('Forbidden: admin role check failed');
    }
    if (!roleRow) {
      throw new Error('Forbidden: super admin access required');
    }

    return next({
      context: {
        supabase:   adminClient, // service-role for admin data queries
        userClient,              // user-scoped, if needed
        userId,
        claims:     data.claims,
        isAdmin:    true,
      },
    });
  },
);
