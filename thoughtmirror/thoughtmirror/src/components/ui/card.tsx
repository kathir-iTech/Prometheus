import type { ReactClassAttributes } from "react";

export function Card({
  className,
  children,
  ...props
}: ReactClassAttributes<HTMLDivElement> & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white shadow-sm ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
