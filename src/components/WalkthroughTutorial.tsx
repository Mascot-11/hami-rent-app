import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, CreditCard, Share2, LayoutDashboard,
  X, ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";

const STORAGE_KEY = "hamrorent_tutorial_done";

const STEPS = [
  {
    icon: LayoutDashboard,
    title: "Welcome to Hamro Rent 🎉",
    description:
      "This quick tour shows you the core workflow. You can skip at any time — everything is here whenever you need it.",
    hint: null,
    action: null,
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Users,
    title: "Step 1 — Add your tenants",
    description:
      "Go to Tenants and add each person renting from you. Set their name, room number, and optionally a base rent and default water amount so bills fill in automatically.",
    hint: "Tip: Setting base rent saves you time every month.",
    action: { label: "Go to Tenants", to: "/tenants" },
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-600",
  },
  {
    icon: FileText,
    title: "Step 2 — Create a bill",
    description:
      "Each month, create a bill for each tenant. Enter rent, water, electricity (meter reading or flat amount), and any extra charges. The total is calculated automatically in Nepali Rupees.",
    hint: "Tip: Bills use Bikram Sambat months — no conversion needed.",
    action: { label: "Create first bill", to: "/bills/new" },
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-600",
  },
  {
    icon: CreditCard,
    title: "Step 3 — Record payments",
    description:
      "When a tenant pays, open their bill and record the payment with the date, amount, and method (cash, eSewa, Khalti, bank). Partial payments are tracked automatically.",
    hint: "Tip: The bill status updates instantly — Paid, Partial, or Pending.",
    action: { label: "View bills", to: "/bills" },
    color: "from-green-500/20 to-green-500/5",
    iconColor: "text-green-600",
  },
  {
    icon: Share2,
    title: "Step 4 — Share receipts",
    description:
      "Every bill has a shareable link and a WhatsApp button. Send your tenant a receipt instantly — no app download needed on their end.",
    hint: "Tip: You can also download the bill as a PNG image.",
    action: null,
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-600",
  },
];

export function WalkthroughTutorial() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Show only for first-time users
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the dashboard loads first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  };

  const goTo = (next: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 150);
  };

  const next = () => {
    if (step < STEPS.length - 1) goTo(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) goTo(step - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="Getting started tutorial"
      >
        <div
          className="pointer-events-auto w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Coloured top band */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${current.color.replace("/5", "/60").replace("/20", "/100")}`} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Getting started
              </span>
            </div>
            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              aria-label="Skip tutorial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div
            className={`px-5 pb-2 transition-opacity duration-150 ${animating ? "opacity-0" : "opacity-100"}`}
          >
            {/* Icon */}
            <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${current.color} mb-4`}>
              <Icon className={`h-6 w-6 ${current.iconColor}`} />
            </div>

            <h2 className="text-lg font-semibold leading-snug mb-2">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>

            {current.hint && (
              <p className="mt-3 text-xs text-primary bg-primary/8 rounded-lg px-3 py-2">
                {current.hint}
              </p>
            )}

            {current.action && (
              <Link to={current.action.to} onClick={dismiss}>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-xs">
                  {current.action.label}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t mt-2">
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === step
                      ? "w-5 h-2 bg-primary"
                      : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 mr-1"
              >
                Skip
              </button>
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={prev} className="h-8 px-3 text-xs gap-1">
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </Button>
              )}
              <Button size="sm" onClick={next} className="h-8 px-4 text-xs gap-1">
                {isLast ? "Done" : "Next"}
                {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
