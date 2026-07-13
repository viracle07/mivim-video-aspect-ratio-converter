import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="text-sm font-medium text-mivim-600">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-ink/60">That MiVim page is not available.</p>
        <Button asChild className="mt-6" href="/">
          Go home
        </Button>
      </div>
    </main>
  );
}
