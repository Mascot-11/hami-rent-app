/**
 * EmptyDashboard — shown when a user has no tenants and no bills.
 *
 * Replaces the blank stat cards + empty lists that currently greet new users.
 * Shows a clear 3-step "Start here" flow with actions at every step.
 * Disappears automatically once the user has at least one tenant.
 */
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, ArrowRight, CheckCircle2,
  ChevronRight, Sparkles, Building2, Receipt,
} from "lucide-react";

interface Props {
  /** Whether the user has completed the walkthrough tutorial before */
  tutorialSeen: boolean;
  onRestartTutorial: () => void;
}

const STEPS = [
  {
    n: "1",
    icon: <Users className="h-5 w-5" />,
    color: "bg-blue-500/10 text-blue-600",
    title: "Add your first tenant",
    body: "Enter their name, room number, phone, and monthly rent. Takes 30 seconds.",
    cta: "Add tenant",
    to: "/tenants" as const,
    done: false,
  },
  {
    n: "2",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-amber-500/10 text-amber-600",
    title: "Create a bill",
    body: "Pick a tenant and BS month. Enter meter readings — totals calculate automatically.",
    cta: "Create bill",
    to: "/bills/new" as const,
    done: false,
  },
  {
    n: "3",
    icon: <Receipt className="h-5 w-5" />,
    color: "bg-green-500/10 text-green-600",
    title: "Record payment & share receipt",
    body: "Log the payment and send your tenant a shareable link — no app needed on their end.",
    cta: "View bills",
    to: "/bills" as const,
    done: false,
  },
];

export function EmptyDashboard({ tutorialSeen, onRestartTutorial }: Props) {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      {/* Welcome header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          You're all set — let's get started
        </div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl mb-2">
          Welcome to Hamro Rent
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
          Your dashboard will show rent collection stats, bills, and payment history once you have tenants. Here's how to get there in 3 steps.
        </p>
      </div>

      {/* 3-step guide */}
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <Card
            key={step.n}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            {/* Step number + icon */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2 flex-shrink-0">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${step.color}`}>
                {step.icon}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest sm:text-center">
                Step {step.n}
              </div>
            </div>

            {/* Connector line — desktop only */}
            {i < STEPS.length - 1 && (
              <div className="hidden sm:block absolute left-[28px] mt-10 w-px h-full bg-border" />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base mb-1">{step.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>

            {/* CTA */}
            <Link to={step.to} className="flex-shrink-0 self-start sm:self-center">
              <Button
                size="sm"
                variant={i === 0 ? "default" : "outline"}
                className="gap-1.5 whitespace-nowrap"
              >
                {step.cta}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Quick actions strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/tenants">
          <Card className="p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Manage tenants</p>
              <p className="text-xs text-muted-foreground">Add, edit, archive tenant records</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </Card>
        </Link>
        <Link to="/profile">
          <Card className="p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Set up your profile</p>
              <p className="text-xs text-muted-foreground">Your name & address appear on bills</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </Card>
        </Link>
      </div>

      {/* What you'll see once active */}
      <div className="border border-border rounded-xl p-5 sm:p-6 bg-muted/20">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Once you have tenants and bills, your dashboard will show:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Collected this month", preview: "रू —" },
            { label: "Outstanding", preview: "रू —" },
            { label: "Bills paid", preview: "— / —" },
            { label: "Collection rate", preview: "—%" },
          ].map(({ label, preview }) => (
            <div key={label} className="bg-background border border-border rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">{label}</p>
              <p className="font-display text-xl text-muted-foreground/40">{preview}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Month-over-month comparison, bill filters, billed/not-billed breakdown — all appear automatically once you have data.
        </p>
      </div>

      {/* Re-open tutorial */}
      {tutorialSeen && (
        <div className="text-center">
          <button
            onClick={onRestartTutorial}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors inline-flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Restart guided tour
          </button>
        </div>
      )}
    </div>
  );
}
