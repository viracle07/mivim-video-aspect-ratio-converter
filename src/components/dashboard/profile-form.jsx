"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/contexts/workspace-context";

export function ProfileForm() {
  const { workspace, updateProfile } = useWorkspace();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (workspace) setForm(workspace.profile); }, [workspace]);
  if (!form) return <div className="h-64 animate-pulse rounded-lg bg-white" />;

  function change(event) {
    setSaved(false);
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    updateProfile(form);
    setSaved(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader><h2 className="font-semibold">Creator details</h2><p className="mt-1 text-sm text-ink/60">These details personalize your workspace.</p></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <label className="block text-sm font-medium">Display name<Input className="mt-2" name="displayName" value={form.displayName} onChange={change} required /></label>
            <label className="block text-sm font-medium">Studio or business<Input className="mt-2" name="studioName" value={form.studioName} onChange={change} placeholder="Optional" /></label>
            <label className="block text-sm font-medium">Email address<Input className="mt-2 bg-mist" value={form.email} disabled /></label>
            <label className="block text-sm font-medium">Timezone<Input className="mt-2" name="timezone" value={form.timezone} onChange={change} /></label>
            <div className="flex items-center gap-3"><Button type="submit">Save changes</Button>{saved && <span className="flex items-center gap-2 text-sm text-mivim-600"><CheckCircle2 className="h-4 w-4" />Saved</span>}</div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-mist text-mivim-600"><UserRound className="h-9 w-9" /></div>
          <p className="mt-4 font-semibold">{form.displayName}</p><p className="mt-1 text-sm text-ink/55">{form.studioName || "Independent creator"}</p>
          <div className="mt-5 border-t border-line pt-5 text-left text-sm"><p className="text-ink/55">Account email</p><p className="mt-1 break-all font-medium">{form.email}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
