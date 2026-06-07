import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { toast } from "sonner";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Hamro Rent" },
      { name: "description", content: "Sign in to Hamro Rent to manage your tenants and bills." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm");
      }
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] bg-foreground text-background p-10 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Hamro Rent" className="h-9 w-9 rounded-full object-cover ring-2 ring-background/20" />
          <span className="font-display text-xl font-bold text-background">Hamro Rent</span>
        </Link>
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">Trusted by Nepali landlords</div>
          <h2 className="font-display text-4xl xl:text-5xl text-background leading-tight mb-6">
            Your rental ledger, managed.
          </h2>
          <div className="space-y-4">
            {[
              "Bikram Sambat bills — no calendar conversion",
              "Electricity meter readings with carry-forward",
              "Shareable receipts for your tenants on WhatsApp",
              "Monthly summaries & Excel exports",
            ].map(f => (
              <div key={f} className="flex items-start gap-3 text-background/70 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-background/35">© 2026 Hamro Rent · Built by Shreeyush Dhungana</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 lg:hidden">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src={logo} alt="Hamro Rent" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <div className="font-display text-xl font-bold">Hamro Rent</div>
              <div className="text-xs text-muted-foreground">हाम्रो रेन्ट</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-1.5">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to your Hamro Rent account"
                : "Start managing your rentals in minutes"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <FieldLabel help={HELP.authEmail} required>Email address</FieldLabel>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 h-11"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <FieldLabel help={HELP.authPassword} required>Password</FieldLabel>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 h-11"
                  placeholder={mode === "signin" ? "Your password" : "Min. 6 characters"}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-sm font-medium rounded-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-sm">
            <span className="text-muted-foreground">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
            <HelpTip text={HELP.authSwitchMode} label="Switch mode" />
          </div>

          <p className="mt-8 text-xs text-center text-muted-foreground leading-relaxed">
            By continuing, you agree to our terms of service. Your data is private and only accessible to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
