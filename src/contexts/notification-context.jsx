"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const knownIds = useRef(null);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) throw new Error("Notifications could not be loaded.");
    const result = await response.json();
    const next = result.notifications || [];
    if (knownIds.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
      next.filter((item) => !item.read && !knownIds.current.has(`${item.scope}:${item.id}`)).slice(0, 3).forEach((item) => new Notification(item.title, { body: item.message }));
    }
    knownIds.current = new Set(next.map((item) => `${item.scope}:${item.id}`));
    setNotifications(next);
    setLoading(false);
  }, []);
  useEffect(() => { refresh().catch(() => setLoading(false)); const timer = setInterval(() => refresh().catch(() => {}), 60000); return () => clearInterval(timer); }, [refresh]);
  async function markRead(items) {
    const unread = items.filter((item) => !item.read);
    if (!unread.length) return;
    setNotifications((current) => current.map((item) => unread.some((target) => target.id === item.id && target.scope === item.scope) ? { ...item, read: true } : item));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: unread.map(({ id, scope }) => ({ id, scope })) }) });
  }
  return <NotificationContext.Provider value={{ notifications, unread: notifications.filter((item) => !item.read).length, loading, refresh, markRead }}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("useNotifications must be used inside NotificationProvider.");
  return value;
}
