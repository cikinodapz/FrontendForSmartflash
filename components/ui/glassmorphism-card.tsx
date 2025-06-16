import { cn } from "@/lib/utils"
import { Card, type CardProps } from "@/components/ui/card"

interface GlassmorphismCardProps extends CardProps {
  intensity?: "light" | "medium" | "strong"
}

export function GlassmorphismCard({ className, intensity = "medium", children, ...props }: GlassmorphismCardProps) {
  const intensityClasses = {
    light: "bg-white/10 dark:bg-white/5 backdrop-blur-sm",
    medium: "bg-white/20 dark:bg-white/10 backdrop-blur-md",
    strong: "bg-white/30 dark:bg-white/15 backdrop-blur-lg",
  }

  return (
    <Card
      className={cn(
        "border border-white/20 dark:border-white/10 shadow-xl",
        intensityClasses[intensity],
        "hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
