import { ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BookOpen, CalendarPlus, ClipboardCheck, Bell, Activity, Bot, MessageCircle,
} from "lucide-react";
import { MOCK_USER } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CaraBot } from "@/components/CaraBot";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/discover", label: "Discover", icon: BookOpen },
  { to: "/book", label: "Book", icon: CalendarPlus },
  { to: "/follow-up", label: "Follow-Up", icon: ClipboardCheck },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/health-log", label: "Health Log", icon: Activity },
  { to: "/assistant", label: "CaraBot", icon: Bot },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [chatOpen, setChatOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">N</div>
            <div>
              <div className="font-semibold text-sm">NCD Care</div>
              <div className="text-xs text-muted-foreground">Malaysia · MOH</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.to, (it as any).exact);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-sm font-medium">
              {MOCK_USER.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{MOCK_USER.name}</div>
              <div className="text-xs text-muted-foreground">{MOCK_USER.age}y · {MOCK_USER.gender}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center text-sm font-bold">N</div>
            <div className="text-sm font-semibold">NCD Care Malaysia</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-accent grid place-items-center text-xs font-medium">
            {MOCK_USER.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">{children}</main>

        {/* Bottom tab bar - mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-border">
          <div className="grid grid-cols-7">
            {navItems.map((it) => {
              const Icon = it.icon;
              const active = isActive(it.to, (it as any).exact);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="leading-tight">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Floating CaraBot */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center hover:scale-105 transition-transform"
        aria-label="Open CaraBot"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      <CaraBot open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
