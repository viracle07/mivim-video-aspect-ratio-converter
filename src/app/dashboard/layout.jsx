import { AppShell } from "@/components/app/app-shell";
import { ProtectedRoute } from "@/components/app/protected-route";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/workspace-context";

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <WorkspaceProvider><AppShell>{children}</AppShell></WorkspaceProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
