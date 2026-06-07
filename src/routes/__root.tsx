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
import { PWAProvider } from "@/components/PWAProvider";
import { DemoProvider } from "@/lib/demo-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-8xl mb-4">🏠</p>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">404</h1>
        <h2 className="text-lg font-semibold text-foreground mb-1">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">
          This page didn't load
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Something went wrong. You can try refreshing or head back home.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Hamro Rent — Nepal's Landlord Manager" },
      { name: "description", content: "Track tenants, bills and payments in Bikram Sambat. Works offline. Free for Nepal landlords." },
      { name: "author", content: "Shreeyush Dhungana" },
      { name: "keywords", content: "hamro rent, Nepal landlord app, tenant management, BS calendar billing, offline rent tracker" },
      // PWA
      { name: "application-name", content: "Hamro Rent" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Hamro Rent" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "msapplication-TileColor", content: "#7a3e28" },
      { name: "theme-color", content: "#7a3e28" },
      // OG
      { property: "og:title", content: "Hamro Rent — Nepal's Landlord Manager" },
      { property: "og:description", content: "Manage rent, electricity & water bills in Nepali BS calendar. Works offline as a PWA." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hamro Rent — Nepal's Landlord Manager" },
      { name: "twitter:image", content: "/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" } as any,
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
    // AssistLoop widget
    if (import.meta.env.VITE_ASSISTLOOP_AGENT_ID) {
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
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>
        <PWAProvider>
          <AuthSync router={router} />
          <Outlet />
          <Toaster />
        </PWAProvider>
      </DemoProvider>
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
