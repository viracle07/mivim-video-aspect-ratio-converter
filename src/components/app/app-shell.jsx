"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CloudOff, CreditCard, History, LayoutDashboard, LogOut, Shield, UploadCloud, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBanner } from "@/components/auth/verification-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { hasFirebaseConfig } from "@/lib/env";
import { NotificationMenu } from "@/components/app/notification-menu";
import { ThemeControl } from "@/components/app/theme-control";

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
  const visibleNav = nav.filter((item) => item.label !== "Admin" || user?.role === "admin");

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-white px-4 py-5 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-mivim-600 font-semibold text-white">M</span>
          <span>
            <span className="block font-semibold">MiVim</span>
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
        <header className="sticky top-0 z-20 border-b border-line bg-white/92 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-mivim-600" />
              <span className="font-medium">Creator workspace</span>
              {!hasFirebaseConfig && <span className="hidden items-center gap-1 text-xs text-ink/45 sm:flex"><CloudOff className="h-3.5 w-3.5" />Local preview</span>}
            </div>
            <div className="flex items-center gap-3">
              <ThemeControl compact />
              <NotificationMenu />
              <span className="hidden text-sm text-ink/60 sm:inline">{user?.email}</span>
              <Button variant="secondary" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </header>
        <main className="px-5 py-6 pb-24 lg:px-8 lg:pb-8">
          <VerificationBanner />
          {children}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
          {visibleNav.filter((item) => item.label !== "Admin").map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium", active ? "text-mivim-600" : "text-ink/55")}><Icon className="h-5 w-5" /><span>{item.label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
