import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Hamro Rent" },
      { name: "description", content: "Terms of Service for Hamro Rent — Nepal's rental management app." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "2082 Jestha 28";

function TermsPage() {
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
            <FileText className="h-3.5 w-3.5" /> Legal
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using Hamro Rent ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. Hamro Rent is designed for landlords and property managers in Nepal to manage their rental properties, tenants, and billing.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>Hamro Rent provides a web-based application for:</p>
            <ul>
              <li>Managing tenant profiles and rental agreements</li>
              <li>Generating monthly bills in the Bikram Sambat (BS) calendar</li>
              <li>Calculating electricity, water, and additional charges</li>
              <li>Recording and tracking payments</li>
              <li>Generating shareable bill links for tenants</li>
              <li>Exporting rental data and reports</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>To use the Service, you must create an account with a valid email address. You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring that all information you provide is accurate and up to date</li>
              <li>Notifying us immediately of any unauthorised use of your account</li>
            </ul>
            <p>You must be at least 18 years old to create an account. By creating an account, you represent that you meet this requirement.</p>
          </Section>

          <Section title="4. Data Ownership">
            <p>You retain full ownership of all data you enter into Hamro Rent, including tenant information, bill records, and payment histories. We do not claim any rights over your data. You may export your data at any time using the Export feature.</p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Store false or misleading information about tenants</li>
              <li>Attempt to gain unauthorised access to other users' accounts</li>
              <li>Reverse engineer or attempt to extract the source code of the Service</li>
              <li>Use the Service for any purpose other than managing legitimate rental properties</li>
            </ul>
          </Section>

          <Section title="6. Privacy and Data Security">
            <p>Your privacy is important to us. Please review our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>, which describes how we collect, use, and protect your information. We use industry-standard encryption and security practices to protect your data.</p>
          </Section>

          <Section title="7. Service Availability">
            <p>We aim to provide reliable access to the Service. However, we do not guarantee uninterrupted, error-free access. The Service may be temporarily unavailable for maintenance, updates, or due to circumstances beyond our control. We are not liable for any losses arising from service interruptions.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>To the maximum extent permitted by law, Hamro Rent and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. This includes loss of data, loss of revenue, or business interruption.</p>
            <p>The Service is provided "as is" without warranties of any kind, either express or implied.</p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>We may update these Terms of Service from time to time. We will notify registered users of significant changes by email or by displaying a prominent notice in the application. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
          </Section>

          <Section title="10. Governing Law">
            <p>These Terms of Service are governed by the laws of Nepal. Any disputes arising from these terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of Nepal.</p>
          </Section>

          <Section title="11. Contact">
            <p>If you have any questions about these Terms of Service, please contact us through the application or at the email address associated with your account.</p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Hamro Rent. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
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
      <div className="text-muted-foreground leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
