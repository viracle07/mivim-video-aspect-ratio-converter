"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CloudOff, CreditCard, History, LayoutDashboard, LogOut, Menu, Shield, UploadCloud, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBanner } from "@/components/auth/verification-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { hasFirebaseConfig } from "@/lib/env";
import { NotificationMenu } from "@/components/app/notification-menu";
import { ThemeControl } from "@/components/app/theme-control";
import { InstallButton } from "@/components/pwa/install-button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "Upload", icon: UploadCloud },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/account", label: "Account", icon: UserRound },
  { href: "/dashboard/admin", label: "Admin", icon: Shield }
];

export function AppShell({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleNav = nav.filter((item) => item.label !== "Admin" || user?.role === "admin");

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  return (
    <div className="theme-adaptive min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-surface px-4 py-5 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-mivim-600 font-semibold text-white">M</span>
          <span>
            <span className="block font-semibold">Mivim Video Resizer</span>
            <span className="text-xs text-ink/55">Video converter</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-ink/70 transition",
                  active ? "bg-mivim-600 text-white" : "hover:bg-mist hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-3 sm:h-16 sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <BarChart3 className="h-5 w-5 text-mivim-600" />
              <span className="truncate font-medium"><span className="sm:hidden">Mivim</span><span className="hidden sm:inline">Creator workspace</span></span>
              {!hasFirebaseConfig && <span className="hidden items-center gap-1 text-xs text-ink/45 sm:flex"><CloudOff className="h-3.5 w-3.5" />Local preview</span>}
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <InstallButton compact />
              <ThemeControl compact />
              <NotificationMenu />
              <span className="hidden text-sm text-ink/60 sm:inline">{user?.email}</span>
              <Button variant="secondary" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <NotificationMenu />
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-ink/70" aria-label={mobileMenuOpen ? "Close account menu" : "Open account menu"} aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="absolute inset-x-3 top-[calc(100%+0.5rem)] rounded-md border border-line bg-surface p-4 shadow-soft sm:hidden">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3"><InstallButton compact /><ThemeControl /></div>
              <Button className="mt-4 w-full" variant="secondary" size="sm" onClick={logout}><LogOut className="h-4 w-4" />Sign out</Button>
            </div>
          )}
        </header>
        <main className="px-3 py-5 pb-24 sm:px-5 sm:py-6 lg:px-8 lg:pb-8">
          <VerificationBanner />
          {children}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
          {visibleNav.filter((item) => item.label !== "Admin").map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={cn("flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-medium sm:text-xs", active ? "text-mivim-600" : "text-ink/55")}><Icon className="h-5 w-5" /><span className="max-w-full truncate">{item.label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
