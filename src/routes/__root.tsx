import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { LanguageProvider } from "@/lib/language-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hamro Rent — Rent Management for Nepali Landlords" },
      { name: "description", content: "Track tenants, electricity, water, and monthly bills in Bikram Sambat. Automatic calculations, shareable receipts, and Excel exports — built for Nepal." },
      { name: "keywords", content: "hamro rent, rent management nepal, bikram sambat, tenant tracking nepal, landlord software nepal, electricity bill calculator, water bill nepal" },
      { name: "author", content: "Shreeyush Dhungana" },
      { name: "robots", content: "index, follow" },
      { name: "language", content: "en-NP" },
      { name: "geo.region", content: "NP" },
      { name: "geo.country", content: "Nepal" },
      { property: "og:title", content: "Hamro Rent — Rent Management for Nepali Landlords" },
      { property: "og:description", content: "Automatic monthly bills, BS calendar, tenant tracking, and shareable receipts. Free for Nepali landlords." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Hamro Rent" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hamro Rent — Rent Management for Nepali Landlords" },
      { name: "twitter:description", content: "Automatic monthly bills, BS calendar, tenant tracking, and shareable receipts." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://hamrorent.app" },
    ],
    scripts: [
      {
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7028965788824874",
        async: true,
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NP">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assistloop.ai/assistloop-widget.js";
    script.async = true;
    script.onload = () => {
      window.AssistLoopWidget?.init({
        agentId: import.meta.env.VITE_ASSISTLOOP_AGENT_ID,
      });
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthSync router={router} />
        <Outlet />
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

function AuthSync({ router }: { router: ReturnType<typeof useRouter> }) {
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
