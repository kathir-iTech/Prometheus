import { motion } from "framer-motion";
import type { ReactInputHTMLAttributes } from "react";

export function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  className,
  ...props
}: ReactInputHTMLAttributes<HTMLInputElement> & {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      className={
        className ||
        "w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
      }
      {...props}
    />
  );
}