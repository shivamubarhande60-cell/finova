import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 min-[700px]:flex-row min-[700px]:items-end min-[700px]:justify-between">
      <div className="min-w-0">
        {kicker ? (
          <p className="mb-1 text-xs text-muted-foreground">{kicker}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="w-full min-w-0 min-[700px]:w-auto">{actions}</div> : null}
    </div>
  );
}
