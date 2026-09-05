import { cn } from "@/lib/utils";

export function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-md border border-line bg-surface px-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-mivim-500 focus:ring-2 focus:ring-mivim-500/20",
        props.className
      )}
    />
  );
}
