import * as React from "react"
import { Label } from "./label"
import { Input } from "./input"
import { cn } from "@/lib/utils"

const FormField = React.forwardRef(({
  label,
  error,
  className,
  id,
  ...props
}, ref) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        ref={ref}
        error={error}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})
FormField.displayName = "FormField"

export { FormField }
