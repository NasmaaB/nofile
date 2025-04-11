import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
    rightElement?: React.ReactNode
    error?: string
    wrapperClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, rightElement, error, wrapperClassName, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)

        const isPassword = type === "password"
        const inputType = isPassword && showPassword ? "text" : type

        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword)
        }

        return (
            <div className={cn("relative w-full", wrapperClassName)}>
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {icon}
                        </div>
                    )}

                    <input
                        type={inputType}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                            icon && "pl-10",
                            (isPassword || rightElement) && "pr-10",
                            error && "border-destructive focus-visible:ring-destructive",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}

                    {!isPassword && rightElement && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {rightElement}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-destructive text-sm mt-1 animate-fade-in">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }