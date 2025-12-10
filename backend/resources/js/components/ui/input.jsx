import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-colors",
        "placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
