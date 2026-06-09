import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calculator, Users, FileText, Share2, Download, Shield,
  ArrowRight, Check, Calendar, Zap, Receipt, BarChart3, Menu, X,
  PlayCircle, ChevronDown, Star, Building2, TrendingUp, Clock,
  Wifi, Home, CreditCard, Droplets, BellRing, RefreshCw,
} from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";


// ─── Hero Diagram Component ───────────────────────────────────────────────────

function HeroDiagram() {
  const [activeFlow, setActiveFlow] = useState<"bill" | "payment" | null>(null);

  return (
    <div className="mt-16 sm:mt-20 relative select-none" aria-hidden="true">
      {/* Ambient glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-300/15 rounded-full blur-3xl" />
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-0 items-center max-w-5xl mx-auto px-4">

        {/* Left column — Tenants */}
        <div className="space-y-3 pr-8">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Tenants
          </div>

          {/* Tenant card 1 */}
          <div
            onMouseEnter={() => setActiveFlow("bill")}
            onMouseLeave={() => setActiveFlow(null)}
            className="group relative bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-100/40 p-4 cursor-default transition-all duration-200 hover:shadow-xl hover:shadow-orange-200/50 hover:-translate-y-0.5"
          >
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-orange-400 to-amber-400" />
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  R
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">Ram B. Thapa</p>
                  <p className="text-xs text-gray-400">Room 2B</p>
                </div>
              </div>
              <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5 font-medium">Active</span>
            </div>
            <div className="bg-orange-50/60 rounded-xl p-2.5 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Base rent</span><span className="font-semibold text-gray-700">रू 10,000</span>
              </div>
              <div className="flex justify-between">
                <span>Move-in</span><span className="font-semibold text-gray-700">2081-01-15</span>
              </div>
            </div>
          </div>

          {/* Tenant card 2 */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-100/40 p-4 cursor-default transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" />
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">Sita K. Shrestha</p>
                <p className="text-xs text-gray-400">Room 3A</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Base rent</span><span className="font-semibold text-gray-700">रू 8,500</span>
              </div>
              <div className="flex justify-between">
                <span>Move-in</span><span className="font-semibold text-gray-700">2081-03-01</span>
              </div>
            </div>
          </div>

          {/* Tenant card 3 */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-100/40 p-4 cursor-default transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                B
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">Bikash Maharjan</p>
                <p className="text-xs text-gray-400">Room 1C</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Base rent</span><span className="font-semibold text-gray-700">रू 12,000</span>
              </div>
              <div className="flex justify-between">
                <span>Move-in</span><span className="font-semibold text-gray-700">2080-09-10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center — Bill Sync hub */}
        <div className="flex flex-col items-center gap-0 relative">
          {/* Connector lines */}
          <div className="flex items-center w-full mb-0">
            {/* left line */}
            <div className={`flex-1 h-px transition-all duration-300 ${activeFlow === "bill" ? "bg-orange-400" : "bg-orange-200"}`} />
            {/* center box */}
            <div className={`relative mx-0 rounded-2xl border-2 shadow-xl transition-all duration-300 w-52 ${activeFlow === "bill" ? "border-orange-400 shadow-orange-200/60 scale-105" : "border-orange-200 shadow-orange-100/40"} bg-white`}>
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <RefreshCw className={`h-4 w-4 text-white ${activeFlow === "bill" ? "animate-spin" : ""}`} style={{ animationDuration: "2s" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Bill Sync</p>
                    <p className="text-[10px] text-gray-400">Auto-calculate</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-orange-50 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 text-gray-500"><Home className="h-3 w-3" /><span>Rent</span></div>
                    <span className="font-semibold text-gray-800">रू 10,000</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 text-gray-500"><Zap className="h-3 w-3" /><span>Electricity</span></div>
                    <span className="font-semibold text-gray-800">140 × 12</span>
                  </div>
                  <div className="flex items-center justify-between bg-cyan-50 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 text-gray-500"><Droplets className="h-3 w-3" /><span>Water</span></div>
                    <span className="font-semibold text-gray-800">रू 300</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Total</span>
                    <span className="font-bold text-orange-600 text-sm">रू 12,980</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-600 font-medium">Real-time calculation</span>
                </div>
              </div>
            </div>
            {/* right line */}
            <div className={`flex-1 h-px transition-all duration-300 ${activeFlow === "payment" ? "bg-orange-400" : "bg-orange-200"}`} />
          </div>
        </div>

        {/* Right column — Bills & Payments */}
        <div className="space-y-3 pl-8">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5" />
            Bills &amp; Payments
          </div>

          {/* Monthly summary card */}
          <div
            onMouseEnter={() => setActiveFlow("payment")}
            onMouseLeave={() => setActiveFlow(null)}
            className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-100/40 p-4 cursor-default transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Jestha 2082</p>
              <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5 font-medium">3 billed</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-green-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-green-600">रू 82,150</p>
                <p className="text-[10px] text-green-500 font-medium">Collected</p>
              </div>
              <div className="bg-red-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-red-500">रू 16,250</p>
                <p className="text-[10px] text-red-400 font-medium">Outstanding</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ width: "83%" }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-right">83% collected</p>
          </div>

          {/* Payment notification card */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-100/40 p-3.5 cursor-default transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Payment received</p>
                <p className="text-xs text-gray-400 truncate">Sita K. Shrestha · eSewa</p>
              </div>
              <p className="text-sm font-bold text-green-600 flex-shrink-0">+रू 8,500</p>
            </div>
          </div>

          {/* Share bill card */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-100/40 p-3.5 cursor-default transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Share2 className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Bill link sent</p>
                <p className="text-xs text-gray-400">hamrorent.app/bill/a3f…</p>
              </div>
              <BellRing className="h-4 w-4 text-violet-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile layout — simplified single column ── */}
      <div className="md:hidden max-w-sm mx-auto px-4 space-y-3">
        {/* Hub card */}
        <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-xl shadow-orange-100/60 p-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
              <RefreshCw className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Auto Bill Calculation</p>
              <p className="text-[10px] text-gray-400">Rent + electricity + water</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-orange-50 rounded-lg p-2">
              <Home className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <p className="font-semibold text-gray-700">Rent</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <Zap className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="font-semibold text-gray-700">Electricity</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-2">
              <Droplets className="h-4 w-4 text-cyan-500 mx-auto mb-1" />
              <p className="font-semibold text-gray-700">Water</p>
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-orange-100/40 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Monthly Summary — Jestha 2082</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-green-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-bold text-green-600">रू 82,150</p>
              <p className="text-[10px] text-green-500">Collected</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-bold text-red-500">रू 16,250</p>
              <p className="text-[10px] text-red-400">Outstanding</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all" style={{ width: "83%" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">83% collected</p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl border border-orange-100 shadow-lg p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Paid</p>
                <p className="text-xs text-green-600 font-bold">+रू 8,500</p>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-orange-100 shadow-lg p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Share2 className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Shared</p>
                <p className="text-xs text-violet-500">Bill link</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hamro Rent — Rent Management for Nepali Landlords" },
      { name: "description", content: "Track tenants, electricity, water, and monthly bills in Bikram Sambat. Automatic calculations, shareable bill links, and clean exports — built for Nepal." },
      { name: "keywords", content: "hamro rent, rent management nepal, bikram sambat, landlord app nepal, tenant tracking, electricity bill calculator nepal" },
      { property: "og:title", content: "Hamro Rent — Rent Management for Nepali Landlords" },
      { property: "og:description", content: "Automatic monthly bills, BS calendar, tenant tracking, and shareable receipts. Free for Nepali landlords." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
      { name: "language", content: "en-NP" },
    ],
  }),
  component: LandingPage,
});

// ─── Demo Data & Storage ──────────────────────────────────────────────────────

const DEMO_KEY = "hamrorent_demo";
const DEMO_TTL = 3 * 24 * 60 * 60 * 1000; // 3 days

function getDemoData() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.createdAt > DEMO_TTL) {
      localStorage.removeItem(DEMO_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function initDemoData() {
  const existing = getDemoData();
  if (existing) return existing;
  const data = {
    createdAt: Date.now(),
    tenants: [
      { id: "t1", name: "Ram Bahadur Thapa", room: "2B", rent: 10000, phone: "9841234567", moveIn: "2081-01" },
      { id: "t2", name: "Sita Kumari Shrestha", room: "3A", rent: 8500, phone: "9851234567", moveIn: "2081-03" },
      { id: "t3", name: "Bikash Maharjan", room: "1C", rent: 12000, phone: "9861234567", moveIn: "2080-09" },
    ],
    bills: [
      { id: "b1", tenantId: "t1", tenant: "Ram Bahadur Thapa", room: "2B", month: "Jestha 2082", rent: 10000, electricity: 1770, water: 500, carry: 1980, total: 14250, paid: 0, status: "pending" },
      { id: "b2", tenantId: "t2", tenant: "Sita Kumari Shrestha", room: "3A", month: "Jestha 2082", rent: 8500, electricity: 1200, water: 500, carry: 0, total: 10200, paid: 10200, status: "paid" },
      { id: "b3", tenantId: "t3", tenant: "Bikash Maharjan", room: "1C", month: "Jestha 2082", rent: 12000, electricity: 2100, water: 500, carry: -500, total: 14100, paid: 7000, status: "partial" },
    ],
  };
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  return data;
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage() {
  const [authed, setAuthed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoTab, setDemoTab] = useState<"dashboard" | "tenant" | "bill">("dashboard");
  const [demoData, setDemoData] = useState<any>(null);
  const [newTenant, setNewTenant] = useState({ name: "", room: "", rent: "" });
  const [billForm, setBillForm] = useState({ tenantId: "", electricity: "", water: "500" });
  const [toast, setToast] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openDemo = () => {
    const d = initDemoData();
    setDemoData(d);
    setDemoOpen(true);
  };

  const addTenant = () => {
    if (!newTenant.name || !newTenant.room || !newTenant.rent) return;
    const d = { ...demoData };
    d.tenants = [...d.tenants, {
      id: `t${Date.now()}`, name: newTenant.name, room: newTenant.room,
      rent: Number(newTenant.rent), phone: "", moveIn: "2082-01",
    }];
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    setDemoData(d);
    setNewTenant({ name: "", room: "", rent: "" });
    showToast(`✓ ${newTenant.name} added`);
  };

  const generateBill = () => {
    if (!billForm.tenantId || !billForm.electricity) return;
    const t = demoData.tenants.find((x: any) => x.id === billForm.tenantId);
    if (!t) return;
    const electricity = Number(billForm.electricity);
    const water = Number(billForm.water);
    const total = t.rent + electricity + water;
    const d = { ...demoData };
    const existingIdx = d.bills.findIndex((b: any) => b.tenantId === t.id && b.month === "Jestha 2082");
    const bill = { id: `b${Date.now()}`, tenantId: t.id, tenant: t.name, room: t.room, month: "Jestha 2082", rent: t.rent, electricity, water, carry: 0, total, paid: 0, status: "pending" };
    if (existingIdx >= 0) d.bills[existingIdx] = bill;
    else d.bills = [...d.bills, bill];
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    setDemoData(d);
    setBillForm({ tenantId: "", electricity: "", water: "500" });
    showToast(`✓ Bill for ${t.name} generated`);
  };

  const markPaid = (billId: string) => {
    const d = { ...demoData };
    d.bills = d.bills.map((b: any) => b.id === billId ? { ...b, paid: b.total, status: "paid" } : b);
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    setDemoData(d);
    showToast("✓ Marked as paid");
  };

  const ctaTo = authed ? "/dashboard" : "/login";
  const ctaLabel = authed ? "Open dashboard" : "Get started free";

  const features = [
    { icon: Users, title: "Tenant Register", desc: "Names, rooms, phone, move-in date, and documents — one tidy list with lifetime payment history." },
    { icon: Calendar, title: "Bikram Sambat Native", desc: "Every bill, payment, and report uses the BS calendar. No mental date conversions ever." },
    { icon: Zap, title: "Smart Electricity", desc: "Per-unit readings or direct amount. Previous reading carries forward automatically." },
    { icon: Calculator, title: "Auto-Calculations", desc: "Rent + electricity + water + extras + previous balance — all summed instantly." },
    { icon: Receipt, title: "Carry-Forward Built In", desc: "Unpaid balance or overpayment credit flows into the next bill automatically." },
    { icon: Share2, title: "Shareable Bill Links", desc: "One tap generates a clean public bill page your tenant can open on WhatsApp." },
    { icon: Download, title: "Excel & PDF Export", desc: "Monthly summary, tenant overview, payment ledger — and printable PDF bills." },
    { icon: BarChart3, title: "Dashboard Overview", desc: "Active tenants, expected, collected, pending — for the current BS month at a glance." },
    { icon: Shield, title: "Your Data, Secured", desc: "Private to your account. Backup and restore your whole ledger as JSON anytime." },
  ];

  const faqs = [
    { q: "Is Hamro Rent free?", a: "Yes — sign up and use it with no credit card required." },
    { q: "Does it work in Bikram Sambat?", a: "Yes. Every bill, payment, and report is BS native, supporting BS 2080 to 2090." },
    { q: "Can my tenants see bills without creating an account?", a: "Yes. Every bill gets a public shareable link you can send on WhatsApp — no login needed for tenants." },
    { q: "What if a tenant overpays or underpays?", a: "The balance carries forward automatically — credit or due — directly into next month's bill." },
    { q: "Can I export my data?", a: "Yes. Excel exports with 3 sheets (summary, tenants, payments) and a full JSON backup anytime." },
    { q: "Will it work on my phone?", a: "Yes. The entire app is mobile-friendly. No installation needed — works in any browser." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background text-sm font-medium px-5 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          {toast}
        </div>
      )}

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Hamro Rent" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20" />
            <span className="font-display text-lg font-bold tracking-tight">Hamro Rent</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <button onClick={openDemo} className="flex items-center gap-1.5 text-primary font-medium hover:text-primary/80 transition-colors">
              <PlayCircle className="h-4 w-4" /> Try demo
            </button>
          </nav>
          <div className="flex items-center gap-2">
            {!authed && (
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="text-sm">Sign in</Button>
              </Link>
            )}
            <Link to={ctaTo}>
              <Button size="sm" className="rounded-full px-5 text-sm font-medium shadow-sm">{ctaLabel}</Button>
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-1.5 rounded-md hover:bg-accent transition-colors">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur px-4 py-4 flex flex-col gap-4 text-sm">
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-foreground">FAQ</a>
            <button onClick={() => { setMenuOpen(false); openDemo(); }} className="flex items-center gap-1.5 text-primary font-medium text-left">
              <PlayCircle className="h-4 w-4" /> Try interactive demo
            </button>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-20 sm:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Built for Nepal · Bikram Sambat native
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.02] tracking-tight">
              Rent & utility bills —{" "}
              <span className="relative">
                <span className="text-primary">auto-calculated.</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 9C60 3 140 1 200 5C260 9 340 7 398 3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
                </svg>
              </span>
            </h1>
            <p className="mt-8 text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Stop juggling notebooks and calculators. Track every tenant, generate monthly bills in Bikram Sambat, handle meter readings, carry-forward balances, and share a clean receipt to your tenant — in seconds.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to={ctaTo}>
                <Button size="lg" className="rounded-full px-7 h-12 text-base font-medium shadow-lg shadow-primary/20">
                  {ctaLabel} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <button onClick={openDemo} className="flex items-center gap-2 h-12 px-6 rounded-full border-2 border-border text-sm font-medium hover:bg-accent hover:border-accent-foreground/20 transition-all">
                <PlayCircle className="h-4 w-4 text-primary" />
                Try the live demo
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free to start", "No installation", "Works on mobile", "BS calendar throughout"].map(f => (
                <span key={f} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* ── Hero Diagram ── */}
          <HeroDiagram />
        </div>
      </section>

      {/* ── Trust band ── */}
      <section className="border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "BS 2080–2090", l: "Calendar coverage" },
            { n: "3-sheet", l: "Excel export" },
            { n: "1-click", l: "WhatsApp sharing" },
            { n: "100%", l: "Auto-calculated bills" },
          ].map(({ n, l }) => (
            <div key={l}>
              <div className="font-display text-2xl sm:text-3xl text-foreground">{n}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Features</div>
          <h2 className="font-display text-3xl sm:text-5xl leading-tight">Everything a Nepali landlord needs.</h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">Designed around the real workflow — from meter reading to payment collection.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6 group hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-display text-xl mb-2">{title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl mb-14">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">How it works</div>
            <h2 className="font-display text-3xl sm:text-5xl">First bill in under 5 minutes.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 md:gap-6">
            {[
              { n: "01", t: "Create your account", d: "Sign up with email. Your ledger is private and secure." },
              { n: "02", t: "Add your tenants", d: "Name, room, phone, monthly rent. One minute per tenant." },
              { n: "03", t: "Generate a bill", d: "Pick tenant and BS month. Enter meter readings — done." },
              { n: "04", t: "Share & collect", d: "Send the link on WhatsApp, record payments, track everything." },
            ].map((s, i) => (
              <div key={s.n} className="relative">
                <div className="font-display text-5xl text-primary mb-3">{s.n}</div>
                <div className="font-display text-xl mb-2">{s.t}</div>
                <p className="text-sm text-background/65 leading-relaxed">{s.d}</p>
                {i < 3 && <ArrowRight className="hidden md:block absolute top-6 -right-3 h-5 w-5 text-background/25" />}
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-4">
            <button onClick={openDemo} className="flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
              <PlayCircle className="h-4 w-4" /> Try the demo now
            </button>
            <Link to={ctaTo}>
              <button className="flex items-center gap-2 h-12 px-6 rounded-full border border-background/20 text-sm font-medium hover:bg-background/10 transition-colors">
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Why Hamro Rent</div>
            <h2 className="font-display text-3xl sm:text-5xl leading-tight">Built for how Nepali landlords actually work.</h2>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
              Most rent apps assume the Gregorian calendar, ignore meter readings, and don't understand how previous-month balances roll forward. Hamro Rent was designed from day one for Nepali households.
            </p>
            <ul className="mt-8 space-y-5">
              {[
                { t: "Bikram Sambat throughout — Baisakh to Chaitra.", d: "No date conversion gymnastics." },
                { t: "Per-unit electricity with previous reading memory.", d: "Just enter this month's reading." },
                { t: "Carry-forward credits and dues, automatic.", d: "Last month's leftover slides into this month's bill." },
                { t: "A receipt your tenant can actually read.", d: "Public link, mobile-friendly, no login needed." },
              ].map(({ t, d }) => (
                <li key={t} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-8 border-2 bg-gradient-to-br from-muted/20 to-background">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider">Monthly summary</span>
            </div>
            {[
              ["Active tenants", "8"],
              ["Expected this month", "रू 96,400"],
              ["Collected", "रू 82,150"],
              ["Pending", "रू 14,250"],
            ].map(([k, v], i, arr) => (
              <div key={k} className={`flex justify-between py-4 ${i < arr.length - 1 ? "border-b" : ""}`}>
                <span className="text-muted-foreground text-sm">{k}</span>
                <span className="font-display text-xl tabular-nums">{v}</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Collection rate</span>
                <span className="font-semibold text-foreground">85%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "85%" }} />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-muted/30 border-y">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">FAQ</div>
            <h2 className="font-display text-3xl sm:text-5xl">Common questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="bg-background rounded-xl border overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-sm sm:text-base hover:bg-accent/50 transition-colors"
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 ml-3 transition-transform duration-200 ${faqOpen === i ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t pt-4">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div className="inline-flex items-center gap-1.5 mb-6">
          {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
        </div>
        <h2 className="font-display text-4xl sm:text-6xl leading-tight">
          Your next month's bills,<br />
          <span className="text-primary">already calculated.</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Join Nepali landlords running their rentals on Hamro Rent. Free to start, no installation required.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to={ctaTo}>
            <Button size="lg" className="rounded-full px-8 h-12 text-base font-medium shadow-lg shadow-primary/20">
              {ctaLabel} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <button onClick={openDemo} className="flex items-center gap-2 h-12 px-6 rounded-full border-2 border-border text-sm font-medium hover:bg-accent transition-colors">
            <PlayCircle className="h-4 w-4 text-primary" />
            Try the demo first
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div>
                <div className="font-display text-base font-semibold">Hamro Rent</div>
                <div className="text-xs text-muted-foreground">Rental Management, Reinvented.</div>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1 text-sm text-muted-foreground">
              <div>
                Built by{" "}
                <a href="https://www.shreeyushdhungana.com.np/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  Shreeyush Dhungana
                </a>
              </div>
              <div className="text-xs">© 2026 Hamro Rent · All rights reserved</div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Demo Modal ── */}
      {demoOpen && demoData && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-background rounded-2xl border-2 shadow-2xl w-full max-w-4xl my-4 overflow-hidden">
            {/* Demo Header */}
            <div className="sticky top-0 bg-background border-b px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">Live Demo</span>
                </div>
                <h2 className="font-display text-xl mt-0.5">Hamro Rent Simulator</h2>
                <p className="text-xs text-muted-foreground">Data saved to your browser for 3 days · No account needed</p>
              </div>
              <button onClick={() => setDemoOpen(false)} className="p-2 rounded-xl hover:bg-accent transition-colors ml-4 flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Demo Tabs */}
            <div className="border-b bg-muted/20 px-4 sm:px-6">
              <div className="flex gap-0.5 -mb-px pt-3 overflow-x-auto">
                {(["dashboard", "tenant", "bill"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDemoTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border border-transparent whitespace-nowrap transition-colors ${demoTab === tab ? "bg-background border-border border-b-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab === "dashboard" ? "📊 Dashboard" : tab === "tenant" ? "👥 Tenants" : "🧾 Bills"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Dashboard Tab */}
              {demoTab === "dashboard" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg">Dashboard</h3>
                    <p className="text-xs text-muted-foreground">Viewing: Jestha 2082</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: "Active Tenants", v: String(demoData.tenants.length), icon: <Users className="h-4 w-4" /> },
                      { l: "Collected", v: `रू ${demoData.bills.reduce((s: number, b: any) => s + b.paid, 0).toLocaleString()}`, icon: <TrendingUp className="h-4 w-4" /> },
                      { l: "Outstanding", v: `रू ${demoData.bills.reduce((s: number, b: any) => s + Math.max(0, b.total - b.paid), 0).toLocaleString()}`, icon: <Clock className="h-4 w-4" /> },
                      { l: "Bills This Month", v: String(demoData.bills.length), icon: <FileText className="h-4 w-4" /> },
                    ].map(({ l, v, icon }) => (
                      <Card key={l} className="p-4">
                        <div className="flex items-center justify-between mb-2 text-muted-foreground">{icon}</div>
                        <div className="text-xs text-muted-foreground mb-1">{l}</div>
                        <div className="font-display text-lg font-semibold">{v}</div>
                      </Card>
                    ))}
                  </div>
                  <Card className="overflow-hidden">
                    <div className="px-4 py-3 border-b bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bills — Jestha 2082</div>
                    <div className="divide-y">
                      {demoData.bills.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{b.tenant} <span className="text-muted-foreground font-normal">· Room {b.room}</span></div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              रू {b.paid.toLocaleString()} paid of रू {b.total.toLocaleString()}
                              {b.total - b.paid > 0 && <span className="text-red-500 ml-1.5">· रू {(b.total - b.paid).toLocaleString()} due</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                              {b.status}
                            </span>
                            {b.status !== "paid" && (
                              <button onClick={() => markPaid(b.id)} className="text-xs text-primary border border-primary/30 rounded-md px-2.5 py-0.5 hover:bg-primary/5 transition-colors">Mark paid</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-sm">
                    <span className="font-semibold text-primary">💡 Demo tip:</span> <span className="text-muted-foreground">Click "Mark paid" above, add tenants in the Tenants tab, or generate bills in the Bills tab. All data is stored locally for 3 days.</span>
                  </div>
                </div>
              )}

              {/* Tenant Tab */}
              {demoTab === "tenant" && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg">Tenants ({demoData.tenants.length})</h3>
                  <Card className="overflow-hidden">
                    <div className="divide-y">
                      {demoData.tenants.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-sm flex-shrink-0">
                              {t.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{t.name}</div>
                              <div className="text-xs text-muted-foreground">Room {t.room} · रू {t.rent.toLocaleString()}/mo</div>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">Active</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="font-semibold text-sm mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Add New Tenant</div>
                    <div className="grid sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Full name</label>
                        <input className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ram Bahadur Thapa" value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Room number</label>
                        <input className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="4A" value={newTenant.room} onChange={e => setNewTenant({ ...newTenant, room: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Monthly rent (रू)</label>
                        <input type="number" className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="8000" value={newTenant.rent} onChange={e => setNewTenant({ ...newTenant, rent: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={addTenant} size="sm" className="rounded-full px-5">Add Tenant</Button>
                  </Card>
                </div>
              )}

              {/* Bill Tab */}
              {demoTab === "bill" && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg">Generate a Bill</h3>
                  <Card className="p-5">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Select tenant</label>
                        <select className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={billForm.tenantId} onChange={e => setBillForm({ ...billForm, tenantId: e.target.value })}>
                          <option value="">Choose a tenant…</option>
                          {demoData.tenants.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name} · Room {t.room} (रू {t.rent.toLocaleString()})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">BS Month</label>
                        <div className="w-full text-sm border rounded-lg px-3 py-2 bg-muted/30 text-muted-foreground">Jestha 2082</div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Electricity amount (रू)</label>
                        <input type="number" className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="1500" value={billForm.electricity} onChange={e => setBillForm({ ...billForm, electricity: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Water charge (रू)</label>
                        <input type="number" className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" value={billForm.water} onChange={e => setBillForm({ ...billForm, water: e.target.value })} />
                      </div>
                    </div>
                    {billForm.tenantId && billForm.electricity && (
                      <div className="mb-4 bg-muted/30 rounded-xl p-4 border">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Bill Preview</div>
                        {(() => {
                          const t = demoData.tenants.find((x: any) => x.id === billForm.tenantId);
                          const total = t ? t.rent + Number(billForm.electricity) + Number(billForm.water) : 0;
                          return (
                            <div className="space-y-2 text-sm">
                              {[
                                ["Room rent", `रू ${t?.rent.toLocaleString()}`],
                                ["Electricity", `रू ${Number(billForm.electricity).toLocaleString()}`],
                                ["Water", `रू ${Number(billForm.water).toLocaleString()}`],
                              ].map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="text-muted-foreground">{k}</span>
                                  <span className="font-medium tabular-nums">{v}</span>
                                </div>
                              ))}
                              <div className="flex justify-between pt-2 border-t font-semibold">
                                <span>Total due</span>
                                <span className="text-primary font-display text-base">रू {total.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    <Button onClick={generateBill} size="sm" className="rounded-full px-5" disabled={!billForm.tenantId || !billForm.electricity}>
                      Generate Bill
                    </Button>
                  </Card>
                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-sm">
                    <span className="font-semibold text-primary">💡 Real app:</span> <span className="text-muted-foreground">Also supports per-unit electricity (prev/curr readings), automatic carry-forward from prior months, additional charges, and instant shareable link generation.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t px-4 sm:px-6 py-4 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Demo data is stored locally in your browser · Auto-cleared after 3 days</p>
              <Link to={ctaTo} onClick={() => setDemoOpen(false)}>
                <Button size="sm" className="rounded-full px-5 text-sm w-full sm:w-auto">
                  Create real account <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
