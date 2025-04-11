import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    }
}

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean;
    delay?: number;
    hover?: "none" | "shadow" | "scale" | "glow" | "tilt";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, animated = false, delay = 0, hover = "none", ...props }, ref) => {
        let hoverClass = ""
        switch (hover) {
            case "shadow":
                hoverClass = "transition-shadow duration-300 hover:shadow-lg"
                break
            case "scale":
                hoverClass = "transition-transform duration-300 hover:scale-105"
                break
            case "glow":
                hoverClass = "glow-effect"
                break
            case "tilt":
                hoverClass = "rotate-on-hover"
                break
            default:
                hoverClass = ""
        }

        const commonProps = {
            ref,
            className: cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm",
                hoverClass,
                className
            )
        }

        if (animated) {
            return (
                <motion.div
                    {...commonProps}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay }}
                    {...props as Omit<HTMLMotionProps<"div">, keyof typeof commonProps>}
                />
            )
        }

        return <div {...commonProps} {...props} />
    }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }