"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/contexts/notification-context";

export default function NotificationsPage() {
  const { notifications, unread, loading, markRead } = useNotifications();
  return <div className="space-y-6"><div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Notifications</h1><p className="mt-1 text-ink/60">Account, conversion, and subscription updates.</p></div>{unread > 0 && <Button variant="secondary" onClick={() => markRead(notifications)}><CheckCheck className="h-4 w-4" />Mark all read</Button>}</div><Card className="overflow-hidden">{loading ? <p className="p-8 text-center text-sm text-ink/50">Loading notifications...</p> : notifications.length ? <div className="divide-y divide-line">{notifications.map((item) => <Link key={`${item.scope}-${item.id}`} href={item.href || "#"} onClick={() => markRead([item])} className="flex gap-4 px-5 py-4 hover:bg-mist"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? "bg-line" : "bg-mivim-600"}`} /><span><span className="font-medium">{item.title}</span><span className="mt-1 block text-sm text-ink/60">{item.message}</span><span className="mt-2 block text-xs text-ink/40">{new Date(item.createdAt).toLocaleString()}</span></span></Link>)}</div> : <div className="p-12 text-center"><Bell className="mx-auto h-7 w-7 text-ink/35" /><p className="mt-3 font-medium">No notifications yet</p></div>}</Card></div>;
}
