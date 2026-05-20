import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const Route = createFileRoute("/api/public/bill/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token;
        if (!/^[0-9a-f-]{36}$/i.test(token)) {
          return new Response(JSON.stringify({ error: "Invalid link" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: bill, error } = await supabase
          .from("bills")
          .select("id, bs_year, bs_month, rent_this_month, water_bill, electricity_mode, electricity_prev_reading, electricity_curr_reading, electricity_rate_snapshot, electricity_service_charge, electricity_direct_amount, carry_forward_credit, notes, share_token, additional_charges(id,label,amount), payments(id,payment_date_bs,amount_paid,payment_method,note), tenants(name, room_number)")
          .eq("share_token", token)
          .maybeSingle();

        if (error || !bill) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(bill), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=0, no-store",
          },
        });
      },
    },
  },
});
