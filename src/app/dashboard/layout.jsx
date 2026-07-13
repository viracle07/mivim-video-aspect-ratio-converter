import { AppShell } from "@/components/app/app-shell";
import { ProtectedRoute } from "@/components/app/protected-route";
import { AuthProvider } from "@/contexts/auth-context";

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppShell>{children}</AppShell>
      </ProtectedRoute>
    </AuthProvider>
  );
}
