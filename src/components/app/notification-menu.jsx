"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/contexts/notification-context";

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const { notifications, unread, markRead } = useNotifications();
  const recent = notifications.slice(0, 6);
  async function toggle() { const next = !open; setOpen(next); if (next) await markRead(recent); }
  return <div className="relative"><button type="button" onClick={toggle} className="relative grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink/65 hover:bg-mist hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} title="Notifications"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral px-1 text-center text-[11px] font-semibold leading-5 text-white">{unread > 9 ? "9+" : unread}</span>}</button>{open && <div className="absolute right-0 top-11 z-50 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-white shadow-soft"><div className="flex items-center justify-between border-b border-line px-4 py-3"><p className="font-semibold">Notifications</p><Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-mivim-600">View all</Link></div>{recent.length ? <div className="divide-y divide-line">{recent.map((item) => <Link key={`${item.scope}-${item.id}`} href={item.href || "/dashboard/notifications"} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-mist"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-ink/55">{item.message}</p></Link>)}</div> : <p className="px-4 py-8 text-center text-sm text-ink/50">You are all caught up.</p>}</div>}</div>;
}
