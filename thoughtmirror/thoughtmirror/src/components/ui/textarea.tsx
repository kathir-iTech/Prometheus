import { motion } from "framer-motion";
import type { ReactTextareaHTMLAttributes } from "react";

export function Textarea({
  placeholder,
  value,
  onChange,
  className,
  ...props
}: ReactTextareaHTMLAttributes<HTMLTextAreaElement> & {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}) {
  const base =
    "w-full rounded-lg border border-zinc-200 bg-white text-zinc-900 p-3 focus:ring-2 focus:ring-zinc-300 focus:outline-none placeholder:text-zinc-400 resize-none leading-relaxed text-sm shadow-sm";
  return (
    <textarea
      placeholder={placeholder || ""}
      value={value || ""}
      onChange={onChange}
      className={`${base} ${className || ""}`}
      {...props}
    />
  );
}