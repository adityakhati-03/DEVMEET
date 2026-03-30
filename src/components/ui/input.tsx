import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#78716c] text-white selection:bg-[#34d399]/30 selection:text-white bg-[#0e1116] flex h-10 w-full min-w-0 rounded-[10px] border border-white/5 px-3 py-2 text-base shadow-inner transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-[2px] focus-visible:ring-[#34d399]/50 focus-visible:border-[#34d399]/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
