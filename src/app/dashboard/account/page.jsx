import { ProfileForm } from "@/components/dashboard/profile-form";
import { ThemeControl } from "@/components/app/theme-control";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AccountPage() {
  return <div className="space-y-6"><div><h1 className="text-3xl font-semibold">Account</h1><p className="mt-1 text-ink/60">Manage your creator profile and appearance.</p></div><ProfileForm /><Card><CardHeader><h2 className="font-semibold">Appearance</h2><p className="mt-1 text-sm text-ink/55">Use a light or dark theme, or follow this device.</p></CardHeader><CardContent><ThemeControl /></CardContent></Card></div>;
}
