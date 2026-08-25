export function Card({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
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
