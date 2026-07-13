import { AuthProvider } from "@/contexts/auth-context";

export default function AuthLayout({ children }) {
  return (
    <AuthProvider>
      <main className="grid min-h-screen place-items-center px-5 py-10">{children}</main>
    </AuthProvider>
  );
}
