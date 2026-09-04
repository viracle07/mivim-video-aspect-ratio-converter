import { AppShell } from "@/components/app/app-shell";
import { ProtectedRoute } from "@/components/app/protected-route";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { NotificationProvider } from "@/contexts/notification-context";

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <WorkspaceProvider><NotificationProvider><AppShell>{children}</AppShell></NotificationProvider></WorkspaceProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
