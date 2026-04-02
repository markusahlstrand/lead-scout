import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-input bg-background hover:bg-muted',
        blue: 'border border-blue-500/30 bg-blue-950 text-blue-200',
        yellow: 'border border-yellow-500/30 bg-yellow-950 text-yellow-200',
        green: 'border border-green-500/30 bg-green-950 text-green-200',
        red: 'border border-red-500/30 bg-red-950 text-red-200',
        gray: 'border border-muted bg-muted text-muted-foreground',
        destructive: 'border border-destructive/50 bg-destructive text-destructive-foreground hover:bg-destructive/80',
        success: 'border border-green-500/30 bg-green-950/50 text-green-300',
        warning: 'border border-yellow-500/30 bg-yellow-950/50 text-yellow-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
