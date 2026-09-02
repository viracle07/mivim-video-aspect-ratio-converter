import { ProfileForm } from "@/components/dashboard/profile-form";

export default function AccountPage() {
  return <div className="space-y-6"><div><h1 className="text-3xl font-semibold">Account</h1><p className="mt-1 text-ink/60">Manage how your creator profile appears in MiVim.</p></div><ProfileForm /></div>;
}
