import { motion } from "framer-motion";

export function Button({
  variant = "primary",
  className,
  ...props
}: {
  variant?: "primary" | "secondary";
  className?: string;
  [key: string]: any;
}) {
  const variantClasses = {
    primary:
      "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium tracking-tight text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-50 disabled:pointer-events-none",
    secondary:
      "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium tracking-tight text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-50",
  };

  const baseClasses = variantClasses[variant];

  return (
    <motion.button
      className={baseClasses + " " + (className || "")}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      {...props}
    />
  );
}