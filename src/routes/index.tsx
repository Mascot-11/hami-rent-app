import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")(({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    // Logged in → go to dashboard; not logged in → show landing page
    throw redirect({ to: data.session ? "/dashboard" : "/home" });
  },
  component: () => null,
}));
