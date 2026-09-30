import { AuthProvider } from "@/contexts/auth-context";

export const metadata = {
  robots: { index: false, follow: false }
};

export default function AuthLayout({ children }) {
  return (
    <AuthProvider>
      <main className="grid min-h-screen place-items-center px-5 py-10">{children}</main>
    </AuthProvider>
  );
}
