import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Hamro Rent" },
      { name: "description", content: "Privacy Policy for Hamro Rent — how we collect, use, and protect your data." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "2082 Jestha 28";

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Hamro Rent" className="h-7 w-7 rounded-lg object-cover" />
            <span className="font-display font-semibold text-sm">Hamro Rent</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-widest mb-4">
            <Shield className="h-3.5 w-3.5" /> Privacy
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: {LAST_UPDATED}</p>
          <div className="mt-4 rounded-xl bg-primary/8 border border-primary/15 px-4 py-3 text-sm text-primary font-medium">
            We don't sell your data. We don't run ads. Your data belongs to you.
          </div>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <Section title="1. Overview">
            <p>Hamro Rent ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data. We operate under the principles of data minimisation — we only collect what is necessary to provide the Service.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong className="text-foreground">Account information:</strong> When you create an account, we collect your email address, full name, phone number (optional), and address (optional). This is used to identify your account and personalise the Service.</p>
            <p><strong className="text-foreground">Rental data:</strong> Information you enter about your tenants, properties, bills, and payments. This data is yours — we store it securely on your behalf to power the Service.</p>
            <p><strong className="text-foreground">Usage data:</strong> We may collect anonymised information about how you use the Service (pages visited, features used) to improve the product. This data cannot be used to identify you.</p>
            <p><strong className="text-foreground">Technical data:</strong> Browser type, device type, and IP address for security and fraud prevention purposes.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>To provide and maintain the Service</li>
              <li>To send you important account notifications (e.g. email confirmation)</li>
              <li>To respond to your support requests</li>
              <li>To detect and prevent fraudulent or unauthorised activity</li>
              <li>To improve and develop new features (using anonymised, aggregated data)</li>
            </ul>
            <p>We do not use your data for advertising. We do not sell your data to any third party.</p>
          </Section>

          <Section title="4. Data Storage and Security">
            <p>Your data is stored in Supabase, a secure cloud database platform. All data is encrypted in transit (TLS/HTTPS) and at rest. Access to your data is restricted to your account only — other users cannot access your tenants, bills, or payment records.</p>
            <p>We use Row-Level Security (RLS) policies at the database level to ensure this isolation is enforced even in the event of an application-level error.</p>
          </Section>

          <Section title="5. Tenant Data Responsibility">
            <p>You are the data controller for the personal information of your tenants that you enter into Hamro Rent. This includes names, phone numbers, and rental details. You are responsible for ensuring you have a lawful basis for storing this information and that your tenants are aware their details are being managed digitally.</p>
            <p>Shareable bill links are accessible to anyone with the link. We recommend only sharing these links directly with the intended tenant.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>Your data is retained for as long as your account is active. If you delete your account, all associated data (tenants, bills, payments, profile) is permanently deleted within 30 days. You can export all your data at any time via the Export feature before deletion.</p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>We use the following third-party services to operate Hamro Rent:</p>
            <ul>
              <li><strong className="text-foreground">Supabase</strong> — database and authentication (supabase.com)</li>
              <li><strong className="text-foreground">Vercel</strong> — hosting and deployment (vercel.com)</li>
            </ul>
            <p>Each of these services has its own privacy policy. We only share the minimum data necessary for them to provide their services.</p>
          </Section>

          <Section title="8. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li><strong className="text-foreground">Access</strong> — view all data we hold about you via the app or by contacting us</li>
              <li><strong className="text-foreground">Export</strong> — download a full copy of your data using the Export feature</li>
              <li><strong className="text-foreground">Correction</strong> — update or correct your account information via Settings</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your account and all associated data</li>
              <li><strong className="text-foreground">Portability</strong> — receive your data in a machine-readable format (JSON export)</li>
            </ul>
          </Section>

          <Section title="9. Cookies">
            <p>Hamro Rent uses minimal cookies required for authentication (session tokens) and user preferences. We do not use tracking cookies or third-party advertising cookies.</p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>Hamro Rent is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice in the application. The "Last updated" date at the top of this page indicates when the policy was last revised.</p>
          </Section>

          <Section title="12. Contact Us">
            <p>If you have any questions, concerns, or requests regarding your privacy or this policy, please contact us through the application. We aim to respond to all privacy-related enquiries within 5 business days.</p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Hamro Rent. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
