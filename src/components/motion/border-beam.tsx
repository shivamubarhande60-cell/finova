import { cn } from "@/lib/utils";

export function BorderBeam({ className }: { className?: string }) {
  return <span className={cn("border-beam", className)} aria-hidden />;
}
