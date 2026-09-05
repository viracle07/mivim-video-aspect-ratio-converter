import Link from "next/link";

export function LegalPage({ title, updated, children }) {
  return <main className="min-h-screen bg-mist px-5 py-12 text-ink"><article className="mx-auto max-w-3xl rounded-lg border border-line bg-white p-6 sm:p-10"><Link href="/" className="text-sm font-medium text-mivim-600">MiVim</Link><h1 className="mt-5 text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-ink/50">Last updated {updated}</p><div className="mt-8 space-y-6 text-sm leading-7 text-ink/75">{children}</div></article></main>;
}
