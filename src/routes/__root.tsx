import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">Page not found.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Go to dashboard</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NCD Care Malaysia" },
      { name: "description", content: "Manage diabetes, hypertension and high cholesterol with Malaysian MOH guidelines." },
      { property: "og:title", content: "NCD Care Malaysia" },
      { name: "twitter:title", content: "NCD Care Malaysia" },
      { property: "og:description", content: "Manage diabetes, hypertension and high cholesterol with Malaysian MOH guidelines." },
      { name: "twitter:description", content: "Manage diabetes, hypertension and high cholesterol with Malaysian MOH guidelines." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69b5e5b3-9320-43de-a6d9-5ffd05f2bd87/id-preview-88abfdc5--a5d29389-51ef-44be-b1e9-eb76ac86c694.lovable.app-1779603809642.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69b5e5b3-9320-43de-a6d9-5ffd05f2bd87/id-preview-88abfdc5--a5d29389-51ef-44be-b1e9-eb76ac86c694.lovable.app-1779603809642.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster />
      </StoreProvider>
    </QueryClientProvider>
  );
}
